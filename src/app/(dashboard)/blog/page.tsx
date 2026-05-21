"use client";

import Link from "next/link";
import {
  useAdminArticles,
  usePendingComments,
  useDeleteArticle,
  useUpdateArticleStatus,
  useModerateComment,
} from "@/services/blog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  MessageSquare,
  FileText,
  Check,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function AdminBlogList() {
  const { toast } = useToast();

  // ==========================================
  // 1. DATA FETCHING (Using Custom Hooks)
  // ==========================================
  const { data: articlesResponse, isLoading: isArticlesLoading } =
    useAdminArticles();
  const { data: commentsResponse, isLoading: isCommentsLoading } =
    usePendingComments();

  // Safely extract arrays from backend response
  const articles = articlesResponse?.data || [];
  const comments = commentsResponse?.data || [];

  // ==========================================
  // 2. MUTATIONS (Using Custom Hooks)
  // ==========================================
  const { mutate: deleteArticle } = useDeleteArticle();
  const { mutate: updateStatus } = useUpdateArticleStatus();
  const { mutate: moderateComment } = useModerateComment();

  // ==========================================
  // 3. EVENT HANDLERS
  // ==========================================
  const handleDelete = (id: string) => {
    if (
      window.confirm(
        "Вы уверены, что хотите удалить эту статью? Это действие нельзя отменить.",
      )
    ) {
      deleteArticle(id, {
        onSuccess: () =>
          toast({ variant: "success", title: "Статья успешно удалена" }),
      });
    }
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    updateStatus(
      { id, isActive: !currentStatus },
      {
        onSuccess: (_, variables) => {
          toast({
            title: `Статус изменен на ${variables.isActive ? "Опубликовано" : "Черновик"}`,
          });
        },
      },
    );
  };

  const handleModerate = (id: string, status: "approved" | "rejected") => {
    moderateComment(
      { id, status },
      {
        onSuccess: (_, variables) => {
          toast({
            variant:
              variables.status === "approved" ? "success" : "destructive",
            title:
              variables.status === "approved"
                ? "Комментарий одобрен"
                : "Комментарий отклонен",
          });
        },
      },
    );
  };

  // ==========================================
  // 4. RENDER STATES
  // ==========================================
  if (isArticlesLoading) {
    return (
      <div className="w-full space-y-4 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-1/3 rounded-lg" />
        <Skeleton className="h-125 w-full rounded-xl" />
      </div>
    );
  }

  return (
    // Note: Removed max-w because layout.tsx already handles the max-w-7xl constraint.
    <div className="w-full animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Управление блогом
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Создавайте статьи, управляйте публикациями и модерируйте
            комментарии.
          </p>
        </div>
        <Button asChild className="shadow-sm shrink-0">
          <Link href="/blog/create">
            <Plus className="mr-2 h-4 w-4" /> Создать статью
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="articles" className="w-full">
        {/* Premium Tabs Styling */}
        <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800/50 p-1 h-auto rounded-lg">
          <TabsTrigger
            value="articles"
            className="flex gap-2 py-2 px-4 rounded-md text-sm transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" /> Статьи
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="flex gap-2 py-2 px-4 rounded-md text-sm transition-all relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
          >
            <MessageSquare className="h-4 w-4" /> Модерация
            {comments.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {comments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* --- ARTICLES TAB --- */}
        <TabsContent value="articles" className="mt-0 outline-none">
          <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 py-4">
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Все материалы ({articles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead className="w-[40%] pl-6">Заголовок</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right pr-6">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article: any) => (
                    <TableRow
                      key={article.id}
                      className="border-slate-100 dark:border-slate-800/60 group"
                    >
                      <TableCell className="font-medium pl-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold line-clamp-1">
                            {article.title}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            /{article.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Interactive Status Badge */}
                        <Badge
                          variant={article.isActive ? "default" : "secondary"}
                          className={`cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                            article.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                          onClick={() =>
                            handleToggleStatus(article.id, article.isActive)
                          }
                        >
                          {article.isActive ? "Опубликовано" : "Черновик"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {format(new Date(article.createdAt), "dd MMM yyyy", {
                          locale: ru,
                        })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            title="Просмотр на сайте"
                          >
                            <Link
                              href={`/blog/${article.slug}`}
                              target="_blank"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            title="Редактировать"
                          >
                            <Link href={`/blog/edit/${article.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(article.id)}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {articles.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-32 text-center text-slate-500 dark:text-slate-400"
                      >
                        Нет статей. Создайте первую публикацию!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- COMMENTS MODERATION TAB --- */}
        <TabsContent value="comments" className="mt-0 outline-none">
          <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 py-4">
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Ожидают проверки ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid gap-4">
              {isCommentsLoading ? (
                <div className="py-12 text-center text-sm text-slate-500 animate-pulse">
                  Загрузка комментариев...
                </div>
              ) : comments.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Очередь модерации пуста. Отличная работа! 🎉
                </div>
              ) : (
                comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className="flex flex-col md:flex-row justify-between items-start gap-4 p-5 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {comment.user?.name || "Анонимный пользователь"}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">
                          •
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          К статье:{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {comment.article?.title}
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-0.5">
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                      <Button
                        size="sm"
                        className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        onClick={() => handleModerate(comment.id, "approved")}
                      >
                        <Check className="h-4 w-4 mr-1.5" /> Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleModerate(comment.id, "rejected")}
                      >
                        <X className="h-4 w-4 mr-1.5" /> Отклонить
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
