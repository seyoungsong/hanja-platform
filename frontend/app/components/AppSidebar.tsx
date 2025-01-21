// app/components/AppSidebar.tsx
import { SiGithub } from "@icons-pack/react-simple-icons"
import { Link } from "@remix-run/react"
import {
  BookmarkCheck,
  Code,
  FileText,
  History,
  Home,
  Languages,
  Lightbulb,
  Microscope,
  Quote,
  Shield,
  User,
  UserSearch,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { getPocketBaseBrowserClient, isAuthValid } from "~/lib/pocketbase"

const navItems = {
  main: [
    {
      path: "/",
      icon: Home,
      label: "Home",
    },
    {
      path: "/example",
      icon: Lightbulb,
      label: "Examples",
    },
  ],
  tasks: [
    {
      path: "/punc",
      icon: Quote,
      label: "Punctuation",
    },
    {
      path: "/ner",
      icon: UserSearch,
      label: "NER",
    },
    {
      path: "/translation",
      icon: Languages,
      label: "Translation",
    },
  ],
  resources: [
    {
      path: "/policies",
      icon: FileText,
      label: "Terms & Policies",
    },
    {
      path: "https://github.com/seyoungsong/hanja-platform",
      icon: SiGithub,
      label: "Github",
    },
    {
      path: "https://arxiv.org/abs/2411.04822",
      icon: Microscope,
      label: "Paper",
    },
    {
      path: "https://seyoung.dev",
      icon: Code,
      label: "Developer",
    },
  ],
}

export function AppSidebar() {
  const pb = getPocketBaseBrowserClient()
  const isLoggedIn = isAuthValid()
  const userEmail = isLoggedIn ? pb.authStore.record?.email : null
  const isAdmin = isLoggedIn ? pb.authStore.record?.verified : false

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.main.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.path}
                      data-umami-event={`nav_main_${item.label.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tasks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.tasks.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.path}
                      data-umami-event={`nav_task_${item.label.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.resources.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.path}
                      data-umami-event={`nav_resource_${item.label.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Pages</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/history-admin"
                      data-umami-event="nav_admin_history"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Input History</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/saved-admin" data-umami-event="nav_admin_saved">
                      <Shield className="h-4 w-4" />
                      <span>Saved Annotations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/history" data-umami-event="nav_footer_history">
                <History className="h-4 w-4" />
                <span>Input History</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/saved" data-umami-event="nav_footer_saved">
                <BookmarkCheck className="h-4 w-4" />
                <span>Saved Annotations</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                to={isLoggedIn ? "/dashboard" : "/login"}
                data-umami-event={
                  isLoggedIn ? "nav_footer_dashboard" : "nav_footer_login"
                }
              >
                <User className="h-4 w-4" />
                <span className="truncate">
                  {isLoggedIn ? userEmail : "Login"}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
