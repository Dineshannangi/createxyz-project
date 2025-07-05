import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "158a44ec-0f4e-4d20-a9f3-fbf927a14dce");
  requestHeaders.set("x-createxyz-project-group-id", "0fd6c003-624b-4965-996d-0de99ee94707");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}