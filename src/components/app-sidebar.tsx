import * as React from "react"
import { useEffect, useState } from "react"
import {
  IconInnerShadowTop,
  IconMessageCircle,
  IconPlus,
} from "@tabler/icons-react"

import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/contexts/AuthContext"
import { chatApi } from "@/services/api"
import type { Conversation } from "@/types/chat"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const data = await chatApi.getConversations()
      setConversations(data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = async () => {
    // This will be handled by the chat interface
    // For now, just reload conversations
    await loadConversations()
  }

  const handleConversationClick = (conversationId: string) => {
    // This will be handled by the chat interface
    // For now, just log the click
    console.log('Conversation clicked:', conversationId)
  }

  if (!user) {
    return null // Don't render sidebar if not authenticated
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">AgentDave</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Chat History Section */}
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleNewChat}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <IconPlus />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            
            <SidebarGroupLabel>Recent Conversations</SidebarGroupLabel>
            
            <SidebarMenu>
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton 
                      onClick={() => handleConversationClick(conversation.id)}
                      tooltip={conversation.title}
                      className="text-left justify-start"
                    >
                      <IconMessageCircle className="size-4" />
                      <span className="truncate">{conversation.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user.name,
          email: user.email,
          avatar: "/avatars/jeffery.jpg"
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}
