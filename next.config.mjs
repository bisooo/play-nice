/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['i.scdn.co'],
    },
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.scdn.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.scdn.co; media-src 'self' https://*.scdn.co; connect-src 'self' https://*.spotify.com; font-src 'self' data:; frame-src https://sdk.scdn.co;"
            },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;