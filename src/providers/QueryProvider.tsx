import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Tạm thời bỏ DevTools nếu chưa cài đặt
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Tạo một client với cấu hình mặc định
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      gcTime: 30 * 60 * 1000, // 30 phút (thay thế cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
};
