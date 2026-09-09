<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AdminNotification extends Model
{
    use BelongsToBusiness;

    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    /** @param  Builder<AdminNotification>  $query */
    public function scopeUnread(Builder $query): void
    {
        $query->whereNull('read_at');
    }

    /**
     * Record an admin notification.
     *
     * @param  array<string, mixed>  $data
     */
    public static function record(string $type, string $title, ?string $message = null, array $data = []): self
    {
        return static::create([
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }
}
