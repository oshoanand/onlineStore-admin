"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface NotificationLog {
  id: string; // CHANGED: Prisma uses 'id', Mongo used '_id'
  title: string;
  body: string;
  targetType: "topic" | "token";
  target: string;
  status: "SENT" | "FAILED";
  sentAt: string;
}

export function NotificationHistory() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to refresh data
  const fetchHistory = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/history`,
      );
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []); // Run once on mount

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Sent History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="text-right">Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No notifications sent yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.status === "SENT" ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Sent
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-[300px]">
                      <span className="font-medium text-sm">{log.title}</span>
                      <span
                        className="text-xs text-muted-foreground truncate"
                        title={log.body}
                      >
                        {log.body}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="uppercase text-[10px]"
                      >
                        {log.targetType}
                      </Badge>
                      <span
                        className="font-mono text-xs text-muted-foreground truncate max-w-[150px]"
                        title={log.target}
                      >
                        {log.target}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {format(new Date(log.sentAt), "MMM d, h:mm a")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
