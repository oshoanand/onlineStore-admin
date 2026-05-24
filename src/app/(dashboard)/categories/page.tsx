"use client";

import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  Image as ImageIcon,
  CornerDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useAdminCategories, useDeleteCategory } from "@/services/category";
import { CategorySheet } from "./components/category-sheet";
import { getImageUrl } from "@/utils/image";

export default function CategoriesPage() {
  const { toast } = useToast();
  const { data: catResponse, isLoading } = useAdminCategories();
  const { mutate: deleteCategory } = useDeleteCategory();

  const allCategories = catResponse?.data || [];

  // Sheet States
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [preselectedParent, setPreselectedParent] = useState<string | null>(
    null,
  );

  // Delete Alert States
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  // Helper to structure flat data into a nested tree
  const buildTree = (
    categories: any[],
    parentId: string | null = null,
  ): any[] => {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .map((cat) => ({
        ...cat,
        children: buildTree(categories, cat.id),
      }));
  };

  const categoryTree = buildTree(allCategories);

  // --- Handlers ---
  const handleCreateNew = () => {
    setEditData(null);
    setPreselectedParent(null);
    setIsSheetOpen(true);
  };

  const handleAddSubcategory = (parentId: string) => {
    setEditData(null);
    setPreselectedParent(parentId);
    setIsSheetOpen(true);
  };

  const handleEdit = (category: any) => {
    setEditData(category);
    setPreselectedParent(null);
    setIsSheetOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!catToDelete) return;
    deleteCategory(catToDelete, {
      onSuccess: () => {
        toast({
          title: "Успешно",
          description: "Категория удалена",
          variant: "success",
        });
        setCatToDelete(null);
      },
      onError: (err: any) => {
        toast({
          title: "Ошибка удаления",
          description:
            err.response?.data?.message ||
            "Категория содержит подкатегории или товары.",
          variant: "destructive",
        });
        setCatToDelete(null);
      },
    });
  };

  // --- Recursive Component for Rendering Tree Rows ---
  const CategoryRow = ({
    category,
    level = 0,
  }: {
    category: any;
    level?: number;
  }) => (
    <div className="flex flex-col">
      <div
        className="group flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
        style={{ paddingLeft: `${level * 2 + 1}rem` }} // Indentation math
      >
        <div className="flex items-center gap-4">
          {/* Hierarchy visual indicator */}
          {level > 0 && (
            <CornerDownRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
          )}

          {/* Thumbnail */}
          <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
            {category.thumbImage ? (
              <img
                src={getImageUrl(category.thumbImage)}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="h-4 w-4 text-slate-300" />
            )}
          </div>

          <div className="flex flex-col">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              {category.name}
            </span>
            <span className="text-xs text-slate-400">/{category.slug}</span>
          </div>
        </div>

        {/* Action Buttons (Visible on Hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={() => handleAddSubcategory(category.id)}
          >
            <Plus className="h-3 w-3 mr-1" /> Подкатегория
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-slate-900"
            onClick={() => handleEdit(category)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => setCatToDelete(category.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Render Children Recursively */}
      {category.children && category.children.length > 0 && (
        <div className="flex flex-col">
          {category.children.map((child: any) => (
            <CategoryRow key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center">
            <FolderTree className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Менеджер категорий
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Организуйте структуру каталога и вложенность
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" /> Добавить категорию
        </Button>
      </div>

      {/* Tree View Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            Загрузка структуры...
          </div>
        ) : categoryTree.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <FolderTree className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500 font-medium">Категории не найдены.</p>
            <Button variant="outline" onClick={handleCreateNew}>
              Создать первую категорию
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {categoryTree.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>

      {/* Slide-out Sheet for Create/Edit */}
      <CategorySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        editData={editData}
        preselectedParentId={preselectedParent}
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={!!catToDelete}
        onOpenChange={(isOpen) => !isOpen && setCatToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Категория будет удалена навсегда. Вы не
              сможете удалить категорию, если внутри нее есть товары или
              подкатегории.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
