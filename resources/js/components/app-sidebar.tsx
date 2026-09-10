import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    CalendarCheck2,
    CalendarDays,
    ChartColumnBig,
    Contact,
    Grid2x2,
    LayoutGrid,
    LogOut,
    Package,
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
import platform from '@/routes/platform';
import { index as products } from '@/routes/products';
import { index as reports } from '@/routes/reports';
import { index as resources } from '@/routes/resources';
import { index as services } from '@/routes/services';
import { index as staff } from '@/routes/staff';
import type { NavItem } from '@/types';

type Business = {
    type?: string;
    terminology?: {
        usesServices?: boolean;
        usesResources?: boolean;
        bookingPlural?: string;
        resourcePlural?: string;
    };
} | null;

const overviewNav = (bookingLabel: string): NavItem[] => [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { title: bookingLabel, href: appointments(), icon: CalendarCheck2 },
    { title: 'Calendar', href: calendar(), icon: CalendarDays },
];

export function AppSidebar() {
    const page = usePage();
    const business = (page.props.business as Business) ?? null;
    const role = (page.props.auth as { user?: { role?: string } } | undefined)?.user?.role;

    const usesServices = business?.terminology?.usesServices ?? true;
    const usesResources = business?.terminology?.usesResources ?? false;
    const resourceLabel = business?.terminology?.resourcePlural ?? 'Resources';
    const bookingLabel = business?.terminology?.bookingPlural ?? 'Appointments';
    const isStaff = role === 'staff';
    const isPlatformAdmin = role === 'platform_admin';

    // Management: services for service verticals, resources for resource
    // verticals; staff always; customers.
    const managementNav: NavItem[] = [
        ...(usesServices ? [{ title: 'Services', href: services(), icon: Sparkles }] : []),
        ...(usesResources ? [{ title: resourceLabel, href: resources(), icon: Grid2x2 }] : []),
        ...(usesServices ? [{ title: 'Products', href: products(), icon: Package }] : []),
        { title: 'Staff', href: staff(), icon: UsersRound },
        { title: 'Customers', href: customers(), icon: Contact },
    ];

    const insightsNav: NavItem[] = [
        { title: 'Reports', href: reports(), icon: ChartColumnBig },
        { title: 'Notifications', href: notifications(), icon: Bell },
        { title: 'Settings', href: businessSettings(), icon: Settings2 },
    ];

    // Staff see only their schedule and clients.
    const staffNav: NavItem[] = [
        { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
        { title: bookingLabel, href: appointments(), icon: CalendarCheck2 },
        { title: 'Calendar', href: calendar(), icon: CalendarDays },
        { title: 'Customers', href: customers(), icon: Contact },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href={dashboard()} prefetch />}>
                            <AppLogo />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {isStaff ? (
                    <NavMain items={staffNav} label="My work" />
                ) : (
                    <>
                        <NavMain items={overviewNav(bookingLabel)} label="Overview" />
                        <NavMain items={managementNav} label="Management" />
                        <NavMain items={insightsNav} label="Insights" />
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                {isPlatformAdmin && (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => router.post(platform.leave().url)}>
                                <LogOut />
                                <span>Exit to platform</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
