import React from 'react';
import {
    ClipboardCheck,
    CheckCircle2,
    Package,
    Truck,
    MapPin,
    CheckCheck,
    AlertTriangle,
    XCircle,
    Clock,
    Calendar
} from 'lucide-react';

const STEPS = [
    { key: 'Order Placed', label: 'Order Placed', icon: ClipboardCheck },
    { key: 'Order Confirmed', label: 'Order Confirmed', icon: CheckCircle2 },
    { key: 'Packed', label: 'Packed', icon: Package },
    { key: 'Shipped', label: 'Shipped', icon: Truck },
    { key: 'Out for Delivery', label: 'Out for Delivery', icon: MapPin },
    { key: 'Delivered', label: 'Delivered', icon: CheckCheck }
];

/**
 * Maps status string to step index (0 to 5)
 */
export const getActiveStepIndex = (status) => {
    switch (status) {
        case 'Pending':
            return 0; // Order Placed active
        case 'Confirmed':
        case 'Processing':
            return 1; // Order Confirmed
        case 'Packed':
            return 2; // Packed
        case 'Shipped':
            return 3; // Shipped
        case 'Out for Delivery':
            return 4; // Out for Delivery
        case 'Delivered':
            return 5; // Delivered (All complete)
        case 'Delayed':
            return 3; // Typically delayed while shipped/transit
        case 'Cancelled':
            return -1;
        default:
            return 0;
    }
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const DeliveryTimeline = ({ order, compact = false }) => {
    if (!order) return null;

    const status = order.status || 'Pending';
    const isCancelled = status === 'Cancelled';
    const isDelivered = status === 'Delivered';
    const isDelayed = status === 'Delayed';
    const activeIndex = getActiveStepIndex(status);

    const expectedDate = order.expectedDeliveryDate || order.expectedDeliveryTime;
    const actualDate = order.actualDeliveryDate || order.actualDeliveryTime;
    const updatedExpectedDate = order.updatedExpectedDeliveryDate;
    const delayReason = order.delayReason;

    // Build timeline lookup map from order.timeline if available
    const timelineMap = {};
    if (Array.isArray(order.timeline)) {
        order.timeline.forEach(item => {
            if (item && item.status) {
                timelineMap[item.status] = item;
            }
        });
    }

    if (isCancelled) {
        return (
            <div className="delivery-timeline-box cancelled">
                <div className="timeline-cancelled-banner">
                    <XCircle size={18} color="#e74c3c" />
                    <div>
                        <strong>Order Cancelled</strong>
                        <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                            This order was cancelled and delivery was discontinued.
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`delivery-timeline-box ${compact ? 'compact' : ''}`}>
            {/* Delay Alert Banner */}
            {isDelayed && (
                <div className="timeline-delayed-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} color="#d97706" />
                        <span style={{ fontWeight: 700, color: '#b45309' }}>Delivery Delayed</span>
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '0.85rem', color: '#92400e' }}>
                        {delayReason ? delayReason : 'Your package encountered an unexpected transit delay.'}
                    </div>
                    {updatedExpectedDate && (
                        <div style={{ marginTop: '4px', fontSize: '0.85rem', fontWeight: 600, color: '#b45309' }}>
                            📅 New Expected Delivery: <span style={{ textDecoration: 'underline' }}>{formatDateTime(updatedExpectedDate)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Step Progress Line */}
            <div className="timeline-stepper">
                {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = isDelivered || idx < activeIndex;
                    const isCurrent = !isDelivered && idx === activeIndex;
                    const isPending = !isDelivered && idx > activeIndex;

                    let stepClass = 'pending';
                    if (isCompleted) stepClass = 'completed';
                    else if (isCurrent) stepClass = isDelayed ? 'delayed-active' : 'active';

                    // Check if timestamp exists
                    const eventInfo = timelineMap[step.key];
                    const eventTime = eventInfo?.timestamp ? formatDateTime(eventInfo.timestamp) : null;

                    return (
                        <div key={step.key} className={`timeline-step ${stepClass}`}>
                            {/* Connector line (not before first item) */}
                            {idx > 0 && (
                                <div
                                    className={`timeline-connector ${
                                        idx <= activeIndex || isDelivered ? 'filled' : ''
                                    }`}
                                />
                            )}

                            {/* Step Node Circle */}
                            <div className="timeline-node">
                                <Icon size={compact ? 14 : 16} />
                            </div>

                            {/* Label */}
                            <div className="timeline-step-info">
                                <div className="timeline-step-title">{step.label}</div>
                                {eventTime && (
                                    <div className="timeline-step-time">{eventTime}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Delivery Time Information Footer */}
            <div className="timeline-delivery-times">
                {isDelivered ? (
                    <div className="delivery-time-item success">
                        <CheckCircle2 size={16} color="#16a34a" />
                        <span>
                            <strong>Delivered on:</strong> {formatDateTime(actualDate) || 'Completed'}
                        </span>
                        {expectedDate && (
                            <span className="expected-subtext">
                                (Expected was: {formatDateTime(expectedDate)})
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="delivery-time-item pending">
                        <Clock size={16} color="#2563eb" />
                        <span>
                            <strong>Expected Delivery:</strong>{' '}
                            {isDelayed && updatedExpectedDate ? (
                                <>
                                    <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '6px' }}>
                                        {formatDateTime(expectedDate)}
                                    </span>
                                    <span style={{ color: '#d97706', fontWeight: 700 }}>
                                        {formatDateTime(updatedExpectedDate)}
                                    </span>
                                </>
                            ) : (
                                <span style={{ color: '#1e293b' }}>
                                    {formatDateTime(expectedDate) || 'Estimated 2-3 business days'}
                                </span>
                            )}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryTimeline;
