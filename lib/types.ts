// Shapes returned by the JSON API (dates arrive as ISO strings)

export type EventItem = {
  id: string;
  title: string;
  category: string;
  city: string;
  startsAt: string;
  pricePaise: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type User = { id: string; email: string; role: "USER" | "ADMIN" };

export type CardDesign = { theme: string; stickers: string[] };
