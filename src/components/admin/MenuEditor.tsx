"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMenuItem, saveMenuItem } from "@/actions/menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CATEGORIES, type Dish } from "@/data/menuData";

type AdminDish = Dish & { available: boolean; sort_order: number };

type MenuEditorProps = {
  items: AdminDish[];
};

const emptyForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  category: "Main Course",
  rating: "4.5",
  popular: false,
  available: true,
  image: "",
};

export function MenuEditor({ items }: MenuEditorProps) {
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const categoryChoices = useMemo(() => {
    const extras = items.map((item) => item.category).filter((name) => name && name !== "All");
    return [...new Set([...DEFAULT_CATEGORIES.filter((name) => name !== "All"), ...extras])];
  }, [items]);

  function edit(item: AdminDish) {
    setForm({
      id: String(item.id),
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      rating: String(item.rating),
      popular: item.popular,
      available: item.available,
      image: item.image,
    });
    setPreview(item.image);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setForm(emptyForm);
    setPreview("");
    setMessage(null);
  }

  function onPhoto(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] pb-16">
      <Card>
        <h2 className="text-xl font-black text-gray-800 dark:text-white mb-4">
          {form.id ? "Update dish" : "Add dish"}
        </h2>
        {message ? <p className="mb-3 text-sm text-red-600">{message}</p> : null}
        <form
          className="space-y-3"
          action={(formData) => {
            startTransition(async () => {
              const result = await saveMenuItem(formData);
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              reset();
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="id" value={form.id} />
          <input type="hidden" name="image" value={form.image} />
          <label className="block text-sm font-semibold">
            Name
            <Input className="mt-1" name="name" required defaultValue={form.name} key={`name-${form.id}`} />
          </label>
          <label className="block text-sm font-semibold">
            Description
            <Textarea className="mt-1 min-h-20" name="description" defaultValue={form.description} key={`desc-${form.id}`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Price (₹)
              <Input className="mt-1" name="price" type="number" min="0" step="1" required defaultValue={form.price} key={`price-${form.id}`} />
            </label>
            <label className="block text-sm font-semibold">
              Rating (0–5)
              <Input className="mt-1" name="rating" type="number" min="0" max="5" step="0.1" required defaultValue={form.rating} key={`rating-${form.id}`} />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Category
            <Input className="mt-1" name="category" list="menu-categories" required defaultValue={form.category} key={`cat-${form.id}`} />
            <datalist id="menu-categories">
              {categoryChoices.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm font-semibold">
            Photo
            <input
              className="mt-1 block w-full text-sm"
              type="file"
              name="photo"
              accept="image/*"
              onChange={(e) => onPhoto(e.target.files?.[0])}
            />
          </label>
          {preview ? <img src={preview} alt="" className="h-32 w-full object-cover rounded-2xl" /> : null}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="popular" defaultChecked={form.popular} key={`pop-${form.id}`} />
            Popular
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="available" defaultChecked={form.available} key={`av-${form.id}`} />
            Show on menu
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : form.id ? "Save changes" : "Add dish"}
            </Button>
            {form.id ? (
              <Button type="button" variant="outline" onClick={reset}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-black text-gray-800 dark:text-white">Current menu</h2>
        {items.map((item) => (
          <div key={String(item.id)} className="rounded-3xl bg-white dark:bg-zinc-900 p-3 shadow flex gap-3">
            <img src={item.image || "/adda.png"} alt="" className="h-20 w-20 rounded-2xl object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">{item.name}</p>
              <p className="text-sm text-gray-500">
                ₹{item.price} · {item.category} · ★ {item.rating}
                {item.available ? "" : " · hidden"}
              </p>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => edit(item)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!confirm(`Remove ${item.name}?`)) return;
                    startTransition(async () => {
                      const result = await deleteMenuItem(String(item.id));
                      if (!result.ok) setMessage(result.error);
                      else router.refresh();
                    });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
