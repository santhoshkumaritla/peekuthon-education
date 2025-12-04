import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BookStackIcon,
  PencilIcon,
  SettingsIcon,
  UserIcon,
  GridIcon,
} from "@/components/icons/StationeryIcons";
import {
  Bot,
  Sparkles,
  ListChecks,
  BookOpen as BookOpenIcon,
  Layers,
  Gamepad2,
  Newspaper,
  Mic,
  Headphones,
  Users,
  LogOut,
  Workflow,
  Wrench,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "Dashboard", url: "/", icon: GridIcon },
  { title: "Read a book", url: "/read-book", icon: BookStackIcon },
  { title: "Question Bot", url: "/question-bot", icon: Bot },
  { title: "Course Generator", url: "/course-generator", icon: GraduationCap },
  { title: "Game Zone", url: "/game-zone", icon: Gamepad2 },
  { title: "Study Rooms", url: "/study-rooms", icon: Users },
  { title: "Hear & Learn", url: "/hear-and-learn", icon: Mic },
  { title: "Live Doubt Session", url: "/live-doubt", icon: Headphones },
];

const toolsItems = [
  { title: "Concept Animator", url: "/concept-animator", icon: Sparkles },
  { title: "Quiz Generator", url: "/quiz-generator", icon: ListChecks },
  { title: "Recommendations", url: "/recommendations", icon: BookOpenIcon },
  { title: "Flash Cards", url: "/flashcards", icon: Layers },
  { title: "News", url: "/news", icon: Newspaper },
  { title: "Flowchart Generator", url: "/flowchart-generator", icon: Workflow },
];

const bottomItems = [
  { title: "Profile", url: "/profile", icon: UserIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
      collapsible="icon"
    >
      <SidebarContent className="flex flex-col h-full">
        {/* Logo Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <BookStackIcon className="w-8 h-8 text-primary" filled />
              <PencilIcon className="w-4 h-4 text-secondary absolute -bottom-1 -right-1" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-sidebar-foreground">
                StudyGenie
              </span>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover-lift">
                    <NavLink
                      to={item.url}
                      end
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all focus-ring",
                        collapsed ? "justify-center" : ""
                      )}
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3">
            {!collapsed && "Tools"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover-lift">
                    <NavLink
                      to={item.url}
                      end
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all focus-ring",
                        collapsed ? "justify-center" : ""
                      )}
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation */}
        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-4">
          {/* User Info */}
          {!collapsed && user && (
            <div className="px-3 py-2 mb-2">
              <div className="text-xs text-sidebar-foreground/60">Logged in as</div>
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {user.studentName}
              </div>
              <div className="text-xs text-sidebar-foreground/60 truncate">
                {user.studentMobile}
              </div>
            </div>
          )}
          
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover-lift">
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all focus-ring",
                        collapsed ? "justify-center" : ""
                      )}
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Logout Button */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover-lift">
                  <Button
                    variant="ghost"
                    onClick={logout}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all focus-ring text-red-600 hover:text-red-700 hover:bg-red-50",
                      collapsed ? "justify-center" : "justify-start"
                    )}
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>Logout</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
