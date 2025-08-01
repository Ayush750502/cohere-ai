// defination.ts

export type RootStackParamList = {
    Auth: undefined;
  Login: undefined;
  SignUp: undefined;
  AppDrawer: undefined;
  Dashboard: undefined;
  Chat: { conversationId?: number };
};

export type AppDrawerParamList = {
  Chat: { conversationId?: number };
};

export type User = {
  username: string; // full name of the user
  email: string; // unique id for the user
  password: string; // password for authentication
  dob: Date; // Date of birth
  phone: number; // user's mobile number
  profileImage: string; // To store address for user's profile image
  conversations: number[]; // list of conversation IDs
};

export type conversations = {
  id: number;
  title? : string;
  conversation: chat[];
};

export enum role {
  user = 0,
  assistant = 1,
}

export type chat = {
  role: role;
  message: string;
};
