<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Appointments Report</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #1f2937; font-size: 11px; }
        h1 { font-size: 18px; margin: 0 0 2px; }
        .muted { color: #6b7280; font-size: 11px; }
        .summary { margin: 14px 0; }
        .summary span { display: inline-block; margin-right: 16px; }
        .summary b { color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
        tr:nth-child(even) td { background: #fafafa; }
    </style>
</head>
<body>
    <h1>{{ $business ?? 'Appointments' }}</h1>
    <div class="muted">Appointments report — {{ $from->format('M j, Y') }} to {{ $to->format('M j, Y') }}</div>

    <div class="summary">
        <span>Total: <b>{{ $summary['total'] }}</b></span>
        <span>Completed: <b>{{ $summary['completed'] }}</b></span>
        <span>Pending: <b>{{ $summary['pending'] }}</b></span>
        <span>Cancelled: <b>{{ $summary['cancelled'] }}</b></span>
        <span>No-show: <b>{{ $summary['no_show'] }}</b></span>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th><th>Customer</th><th>Service</th><th>Staff</th>
                <th>Date</th><th>Time</th><th>Min</th><th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($appointments as $a)
                <tr>
                    <td>{{ $a->appointment_number }}</td>
                    <td>{{ $a->customer?->full_name }}</td>
                    <td>{{ $a->service?->name }}</td>
                    <td>{{ $a->staff?->name ?? '—' }}</td>
                    <td>{{ $a->appointment_date?->format('Y-m-d') }}</td>
                    <td>{{ substr((string) $a->start_time, 0, 5) }}</td>
                    <td>{{ $a->duration }}</td>
                    <td>{{ $a->status->label() }}</td>
                </tr>
            @empty
                <tr><td colspan="8" class="muted">No appointments in this period.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
