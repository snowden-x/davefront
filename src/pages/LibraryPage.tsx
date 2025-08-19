import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { documentApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconLibrary, IconUpload, IconFolder, IconFileText, IconUsers, IconTrash, IconEdit } from '@tabler/icons-react';
import DocumentModal from '@/components/DocumentModal';

interface Document {
  id: string;
  title?: string; // Optional since we'll use metadata.filename
  owner_type: 'user' | 'shared';
  owner_id?: string;
  is_public: boolean;
  created_at: string;
  created_by: string;
  can_edit: boolean;
  can_delete: boolean;
  metadata?: string; // JSON string containing filename, upload info, etc.
}

export function LibraryPage() {
  const { user: currentUser } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  // Helper function to parse metadata and get filename
  const getDocumentInfo = (doc: Document) => {
    try {
      if (doc.metadata) {
        const metadata = JSON.parse(doc.metadata);
        return {
          filename: metadata.filename || 'Unknown File',
          fileType: metadata.file_type || 'Unknown Type',
          fileSize: metadata.file_size || 0,
          uploadedAt: metadata.uploaded_at || doc.created_at,
          uploadedBy: metadata.uploaded_by || doc.created_by
        };
      }
      return {
        filename: doc.title || 'Untitled Document',
        fileType: 'Unknown Type',
        fileSize: 0,
        uploadedAt: doc.created_at,
        uploadedBy: doc.created_by
      };
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return {
        filename: doc.title || 'Untitled Document',
        fileType: 'Unknown Type',
        fileSize: 0,
        uploadedAt: doc.created_at,
        uploadedBy: doc.created_by
      };
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDocuments();
    }
  }, [currentUser]);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await documentApi.getDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err.detail || 'Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = () => {
    setEditingDocument(null);
    setIsModalOpen(true);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentApi.deleteDocument(documentId);
      // Reload documents after deletion
      await loadDocuments();
    } catch (err: any) {
      setError(err.detail || 'Failed to delete document');
      console.error('Error deleting document:', err);
    }
  };

  const handleModalSuccess = () => {
    // Reload documents after successful create/update
    loadDocuments();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDocument(null);
  };

  const personalDocuments = documents.filter(doc => doc.owner_type === 'user');
  const sharedDocuments = documents.filter(doc => doc.owner_type === 'shared');

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Document Library</h1>
          <p className="text-muted-foreground">
            Manage your personal documents and access shared knowledge
          </p>
        </div>
        <Button onClick={handleUploadDocument} className="flex items-center gap-2">
          <IconUpload className="size-4" />
          Upload Document
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <IconFolder className="size-4" />
            Personal Documents ({personalDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <IconUsers className="size-4" />
            Shared Documents ({sharedDocuments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Documents</CardTitle>
              <CardDescription>
                Your private document collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading documents...</div>
              ) : personalDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconFileText className="size-12 mx-auto mb-4 opacity-50" />
                  <p>No personal documents yet</p>
                  <p className="text-sm">Upload your first document to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {personalDocuments.map((doc) => {
                    const docInfo = getDocumentInfo(doc);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <IconFileText className="size-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{docInfo.filename}</div>
                            <div className="text-sm text-muted-foreground">
                              {docInfo.fileType} • {(docInfo.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(docInfo.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      
                                              <div className="flex items-center gap-2">
                          {doc.can_edit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDocument(doc)}
                            >
                              <IconEdit className="size-4" />
                            </Button>
                          )}
                          {doc.can_delete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shared Documents</CardTitle>
              <CardDescription>
                Public knowledge base accessible to all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading documents...</div>
              ) : sharedDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconLibrary className="size-12 mx-auto mb-4 opacity-50" />
                  <p>No shared documents yet</p>
                  <p className="text-sm">Admins can upload shared documents here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sharedDocuments.map((doc) => {
                    const docInfo = getDocumentInfo(doc);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <IconLibrary className="size-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{docInfo.filename}</div>
                            <div className="text-sm text-muted-foreground">
                              Shared • {docInfo.fileType} • {(docInfo.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(docInfo.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      
                                              <div className="flex items-center gap-2">
                          <Badge variant="secondary">Shared</Badge>
                          {doc.can_edit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDocument(doc)}
                            >
                              <IconEdit className="size-4" />
                            </Button>
                          )}
                          {doc.can_delete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DocumentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        document={editingDocument}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
