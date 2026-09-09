<?php

namespace App\Enums;

/**
 * What a signed-in user may do.
 *
 *  - PlatformAdmin operates the whole platform, across every business.
 *  - Tenant owns one business and has full control of it.
 *  - Staff works in one business with a login tied to their provider record;
 *    they manage their own schedule and clients, not the business's settings.
 */
enum UserRole: string
{
    case PlatformAdmin = 'platform_admin';
    case Tenant = 'tenant';
    case Staff = 'staff';

    public function label(): string
    {
        return match ($this) {
            self::PlatformAdmin => 'Platform admin',
            self::Tenant => 'Owner',
            self::Staff => 'Staff',
        };
    }

    /**
     * Whether the role may change the business itself — services, providers,
     * resources, hours and settings. Staff may not.
     */
    public function canManageBusiness(): bool
    {
        return $this !== self::Staff;
    }
}
