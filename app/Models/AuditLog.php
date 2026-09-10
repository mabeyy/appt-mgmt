<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * An append-only audit entry. Business-scoped, so tenants see only their own
 * trail while a platform admin (no bound tenant) sees every tenant's.
 *
 * @property int $id
 * @property int|null $business_id
 * @property int|null $user_id
 * @property string|null $actor_name
 * @property string $action
 * @property string|null $entity_type
 * @property int|null $entity_id
 * @property array<string, mixed>|null $metadata
 * @property Carbon|null $created_at
 */
class AuditLog extends Model
{
    use BelongsToBusiness;

    public const UPDATED_AT = null;

    protected $fillable = [
        'business_id', 'user_id', 'actor_name', 'action', 'entity_type', 'entity_id', 'metadata',
    ];

    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    /**
     * Append an entry. Never throws — auditing must not break the action it
     * describes. The business defaults to the target's, then the bound tenant.
     *
     * @param  array{business_id?: int|null, entity_type?: string|null, entity_id?: int|null, metadata?: array<string, mixed>}  $opts
     */
    public static function record(string $action, array $opts = []): void
    {
        try {
            $user = Auth::user();
            $businessId = $opts['business_id'] ?? app(TenantContext::class)->id();

            $log = new self;
            $log->forceFill([
                'business_id' => $businessId,
                'user_id' => $user?->id,
                'actor_name' => $user !== null ? $user->name : 'System',
                'action' => $action,
                'entity_type' => $opts['entity_type'] ?? null,
                'entity_id' => $opts['entity_id'] ?? null,
                'metadata' => $opts['metadata'] ?? null,
                'created_at' => now(),
            ])->save();
        } catch (\Throwable) {
            // Swallow — a failed audit write must not surface to the user.
        }
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
