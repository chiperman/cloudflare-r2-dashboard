import { createClient } from '@/lib/supabase/server';
import { HomeClientContent } from '@/components/home-client-content';
import { ThemeAwareImage } from '@/components/theme-aware-image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-12 items-center">
        <div className="flex-1 flex flex-col gap-10 max-w-5xl w-full items-center">
          {user ? (
            <HomeClientContent />
          ) : (
            <section className="flex flex-col items-center gap-6 mt-16">
              <h1 className="text-5xl font-bold">Cloudflare R2 Dashboard</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                在您的 Cloudflare R2 存储中上传、查看和管理文件。登录以开始使用。
              </p>
              <ThemeAwareImage />
              <div className="w-full max-w-2xl mt-12">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>这是什么项目？</AccordionTrigger>
                    <AccordionContent>
                      这是一个用于管理 Cloudflare R2 存储文件的现代化 Web 面板，提供安全认证、文件上传、预览和管理等功能。
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>使用了哪些技术？</AccordionTrigger>
                    <AccordionContent>
                      本项目采用 Next.js, Tailwind CSS, shadcn/ui, Supabase (认证与数据库) 和 AWS SDK (用于 R2 操作) 构建。
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>如何开始使用？</AccordionTrigger>
                    <AccordionContent>
                      您需要克隆项目仓库，根据 .env.example 文件配置好您的 Cloudflare R2 和 Supabase 项目密钥，然后便可一键部署至 Vercel 或在本地运行。
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </section>
          )}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p>
            Powered by{' '}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
