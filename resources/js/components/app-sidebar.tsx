import { Link } from '@inertiajs/react';
import {
    Bell,
    CalendarCheck2,
    CalendarDays,
    ChartColumnBig,
    Contact,
    LayoutGrid,
    Settings2,
    Sparkles,
    UsersRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as appointments } from '@/routes/appointments';
import { edit as businessSettings } from '@/routes/business';
import { index as calendar } from '@/routes/calendar';
import { index as customers } from '@/routes/customers';
import { index as notifications } from '@/routes/notifications';
import { index as reports } from '@/routes/reports';
import { index as services } from '@/routes/services';
import { index as staff } from '@/routes/staff';
import type { NavItem } from '@/types';

const overviewNav: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { title: 'Appointments', href: appointments(), icon: CalendarCheck2 },
    { title: 'Calendar', href: calendar(), icon: CalendarDays },
];

const managementNav: NavItem[] = [
    { title: 'Services', href: services(), icon: Sparkles },
    { title: 'Staff', href: staff(), icon: UsersRound },
    { title: 'Customers', href: customers(), icon: Contact },
];

const insightsNav: NavItem[] = [
    { title: 'Reports', href: reports(), icon: ChartColumnBig },
    { title: 'Notifications', href: notifications(), icon: Bell },
    { title: 'Settings', href: businessSettings(), icon: Settings2 },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            render={<Link href={dashboard()} prefetch />}
                        >
                            <AppLogo />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={overviewNav} label="Overview" />
                <NavMain items={managementNav} label="Management" />
                <NavMain items={insightsNav} label="Insights" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
