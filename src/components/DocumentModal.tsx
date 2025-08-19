import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { IconUpload, IconFile, IconX } from '@tabler/icons-react';
import { documentApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isEditMode?: boolean;
  document?: any;
}

export default function DocumentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  isEditMode = false, 
  document 
}: DocumentModalProps) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  
  const [formData, setFormData] = useState({
    owner_type: 'user' as 'user' | 'shared'
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && document) {
        setFormData({
          owner_type: document.owner_type || 'user'
        });
        setFileContent(document.content || '');
        setFileName(document.metadata?.filename || 'Untitled');
      } else {
        // Reset form for new upload
        setFormData({
          owner_type: 'user'
        });
        setFileContent('');
        setFileName('');
        setSelectedFile(null);
      }
      setError(null);
    }
  }, [isOpen, isEditMode, document]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    
    // Store filename for display purposes
    const displayName = file.name.replace(/\.[^/.]+$/, "");
    setFileName(displayName);
    
    // Extract content from file
    try {
      const content = await extractFileContent(file);
      setFileContent(content);
    } catch (err) {
      setError('Failed to read file content');
      setSelectedFile(null);
      setFileName('');
      setFileContent('');
    }
  };

  const extractFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          resolve(content);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        // For PDFs, we'll need to handle this differently
        // For now, just read as text and let the backend handle it
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileName('');
    setFileContent('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditMode && !selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
              if (isEditMode && document) {
          // Update existing document
          const updateData: any = {};
          
          if (fileContent) {
            updateData.content = fileContent;
          }
          
          await documentApi.updateDocument(document.id, updateData);
        } else {
          // Create new document
          const documentData: any = {
            content: fileContent,
            // Auto-generate metadata from file info
            metadata: JSON.stringify({
              filename: fileName,
              file_size: selectedFile?.size,
              file_type: selectedFile?.type,
              uploaded_at: new Date().toISOString(),
              uploaded_by: currentUser?.email
            })
          };
        
        if (formData.owner_type === 'shared') {
          await documentApi.createSharedDocument(documentData);
        } else {
          await documentApi.createDocument(documentData);
        }
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.detail || `Failed to ${isEditMode ? 'update' : 'create'} document`);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Document' : 'Upload New Document'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update document information.' 
              : 'Upload a document file. Content will be extracted automatically.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="file">Upload File</Label>
              {!selectedFile ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".txt,.md,.pdf,.doc,.docx"
                    required
                  />
                  <IconUpload className="size-4 text-muted-foreground" />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <IconFile className="size-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{fileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-6 w-6 p-0"
                  >
                    <IconX className="size-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Supported formats: TXT, MD, PDF, DOC, DOCX
              </p>
            </div>
          )}
          

          
          {!isEditMode && isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="owner_type">Document Type</Label>
              <Select
                value={formData.owner_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, owner_type: value as 'user' | 'shared' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Personal Document</SelectItem>
                  <SelectItem value="shared">Shared Document</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Personal documents are private to you. Shared documents are visible to all users.
              </p>
            </div>
          )}
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (isEditMode ? 'Updating...' : 'Uploading...') 
                : (isEditMode ? 'Update Document' : 'Upload Document')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
