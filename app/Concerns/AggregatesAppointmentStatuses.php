<?php

namespace App\Concerns;

use App\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

trait AggregatesAppointmentStatuses
{
    /**
     * Count appointments grouped by status: [status_value => total].
     *
     * @return Collection<string, int>
     */
    protected function statusCounts(Builder $query): Collection
    {
        return $query
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');
    }

    /**
     * Shape status counts into the label/value/color rows the charts expect.
     *
     * @param  Collection<string, int>  $counts
     * @return array<int, array{status: string, value: int, color: string}>
     */
    protected function statusDistribution(Collection $counts): array
    {
        return array_map(fn (array $s) => [
            'status' => $s['label'],
            'value' => (int) ($counts[$s['value']] ?? 0),
            'color' => $s['color'],
        ], AppointmentStatus::options());
    }
}
