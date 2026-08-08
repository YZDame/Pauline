export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  catalog: string;
  catalogNumber: number;
  catalogOrder: number;
  generationNumber: number;
  generation: string;
  branch: string | null;
  code: string[];
  color: string[];
  collection: string[];
  creationDate: string | null;
  year: string | null;
  reviewRequired: boolean;
  image: string;
  thumbnail: string;
  width: number;
  height: number;
}
