import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true, turbopack: {
        resolveAlias: {
            '@prisma/client': './src/generated/prisma',
        }
    }
};

export default nextConfig;
