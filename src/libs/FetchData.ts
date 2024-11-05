
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { toast } from 'react-toastify';
import fetch from "isomorphic-fetch"

interface PostWithTokenOptions {
  router: AppRouterInstance,
  url: string;
  data: any;
  token: string;
}

interface GetWihTokenOptions {
  router: AppRouterInstance,
  url: string;
  token: string;
}

interface GetOptions {
  url: string;
}

export interface iResponse<T> {
  statusCode: number;
  total: number | undefined
  msg: string;
  data: T;
  err: string | string[];
}

export async function GET<R>({ url }: GetOptions): Promise<R> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      }
    });

    if (res.status === 500)
      toast.error(`Telah terjadi kesalahan!`);

    const result = await res.json();
    if (result?.statusCode === 404 || result?.statusCode === 400) {
      toast.warning(result?.err);
    }

    return result;
  } catch (error) {
    toast.error(`Telah terjadi kesalahan!`);
    throw error;
  }
}

export async function GetWithToken<R>({ router, url, token }: GetWihTokenOptions): Promise<R> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      }
    });

    if (res.status === 500)
      toast.error(`Telah terjadi kesalahan!`);

    const result = await res.json();

    if (result?.statusCode === 401) {
      toast.error(`Sesi login anda telah habis!`);
      router.push("/auth/logout")
    }

    if (result?.statusCode === 403) {
      toast.warning(`Akun anda tidak memiliki hak akses untuk ini!`);
    }

    if (result?.statusCode === 404 || result?.statusCode === 400) {
      toast.warning(result?.err);
    }

    return result;
  } catch (error) {
    toast.error(`Telah terjadi kesalahan!`);
    throw error;
  }
}

export async function PostWithToken<R>({ router, url, data, token }: PostWithTokenOptions): Promise<R> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.status === 500)
      toast.error(`Telah terjadi kesalahan!`);

    const result = await res.json();

    if (result?.statusCode === 401) {
      toast.error(`Sesi login anda telah habis!`);
      router.push("/auth/logout")
    }

    if (result?.statusCode === 403) {
      toast.warning(`Akun anda tidak memiliki hak akses untuk ini!`);
    }

    if (result?.statusCode === 404 || result?.statusCode === 400) {
      toast.warning(result?.err);
    }

    return result;
  } catch (error) {
    toast.error(`Telah terjadi kesalahan!`);
    throw error;
  }
}



