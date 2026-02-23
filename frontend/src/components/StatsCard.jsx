import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function StatsCard({ myData, topUserCount }) {
  if (!myData) return null;
  const percentage = topUserCount > 0 ? Math.round((myData.count / topUserCount) * 100) : 0;

  return (
    <Card className="mb-6 overflow-hidden border-border bg-card shadow-sm">
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Avatar className="w-14 h-14 border-2 border-primary/20 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
            {myData.avatar && <AvatarImage src={myData.avatar} alt="Avatar" />}
            <AvatarFallback className="bg-muted text-muted-foreground font-bold">You</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">Your Stats</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-foreground">{myData.rank}<span className="text-sm text-muted-foreground ml-1">th</span></span>
              <span className="text-sm text-muted-foreground font-mono">/ {myData.count.toLocaleString()} msg</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-bold text-foreground flex items-center gap-2">
              VS Top User
              <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md font-medium">Rank 1</span>
            </span>
            <span className="text-primary font-bold font-mono">{percentage}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div className="bg-primary h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-[10px] text-muted-foreground font-mono">You</p>
            <p className="text-[10px] text-muted-foreground font-mono text-right">Top ({topUserCount.toLocaleString()})</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}