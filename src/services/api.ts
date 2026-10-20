import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const prod = import.meta.env.VITE_APP_API_URL_PRODUCTION as string | undefined;
const dev = import.meta.env.VITE_APP_API_URL_LOCAL as string | undefined;

const apiUrl =
  window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? dev
    : prod;

const api = axios.create({
  baseURL: apiUrl,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers = config.headers ?? {};

    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (!isFormData && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    if (isFormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface HttpRequestParams {
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
}

export async function httpRequest<T = unknown>({
  method,
  url,
  data,
  params,
}: HttpRequestParams): Promise<T> {
  try {
    let response: AxiosResponse<T>;

    const config: AxiosRequestConfig = { params };

    if (method === "GET") {
      response = await api.get<T>(url, config);
    } else if (method === "POST") {
      response = await api.post<T>(url, data, config);
    } else if (method === "PUT") {
      response = await api.put<T>(url, data, config);
    } else if (method === "DELETE") {
      response = await api.delete<T>(url, config);
    } else {
      throw new Error("Método de solicitud no válido");
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

export default api;
