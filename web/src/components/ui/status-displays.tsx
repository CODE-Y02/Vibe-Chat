"use client";

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-[250px] mx-auto text-sm leading-relaxed">
                {description}
            </p>
        </div>
    );
}
