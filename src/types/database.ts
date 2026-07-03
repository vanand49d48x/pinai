export type PinStatus =
  | "draft"
  | "generating"
  | "ready"
  | "scheduled"
  | "publishing"
  | "posted"
  | "failed";

export interface PinterestAccount {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  pinterest_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  pinterest_board_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Pin {
  id: string;
  user_id: string;
  board_id: string | null;
  image_url: string;
  destination_link: string | null;
  topic: string;
  keywords: string;
  title: string | null;
  description: string | null;
  alt_text: string | null;
  status: PinStatus;
  scheduled_at: string | null;
  posted_at: string | null;
  pinterest_pin_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PinWithBoard extends Pin {
  boards: Pick<Board, "id" | "name"> | null;
}
