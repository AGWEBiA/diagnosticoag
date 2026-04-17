import { BookOpen, ClipboardList, Users, Activity, LayoutDashboard, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
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
} from '@/components/ui/sidebar';

const items = [
  { title: 'Visão geral', url: '/admin', icon: LayoutDashboard, end: true },
  { title: 'Knowledge Base', url: '/admin/knowledge', icon: BookOpen, end: false },
  { title: 'Diagnósticos', url: '/admin/diagnosticos', icon: ClipboardList, end: false },
  { title: 'Usuários', url: '/admin/usuarios', icon: Users, end: false },
  { title: 'Logs de IA', url: '/admin/logs', icon: Activity, end: false },
  { title: 'Configurações', url: '/admin/configuracoes', icon: Settings, end: false },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className="flex items-center gap-2"
                        activeClassName="font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
