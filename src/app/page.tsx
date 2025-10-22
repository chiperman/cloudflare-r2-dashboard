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
        <div className="flex-1 flex flex-col gap-10 max-w-5xl w-full items-center p-4">
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
                    <AccordionTrigger>R2-dashboard是干嘛的？</AccordionTrigger>
                    <AccordionContent>
                      一个为您专属打造的 Cloudflare R2
                      私人图片存储库。我们提供了一个比云服务商后台更美观、更易用的界面，让您能像管理本地文件夹一样，轻松管理云端图片。
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>您可以做什么？</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          <b>轻松上传</b>：只需将图片拖拽到指定区域，即可完成上传，支持批量操作。
                        </li>
                        <li>
                          <b>直观浏览</b>
                          ：所有图片以缩略图形式清晰展示，支持文件夹层级，让文件井井有条。
                        </li>
                        <li>
                          <b>便捷分享</b>
                          ：一键复制每张图片的公开访问链接，方便您在任何地方引用和分享。
                        </li>
                        <li>
                          <b>快速定位</b>：内置强大的全局和文件夹内搜索功能，帮您瞬间找到目标图片。
                        </li>
                        <li>
                          <b>权限控制</b>：用户仅可以删除有权限的文件。
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>数据安全与隐私</AccordionTrigger>
                    <AccordionContent>
                      我们极其重视您的数据安全。您的所有文件都直接存储在您自己的 Cloudflare R2
                      存储桶中，本网站不持有您的任何文件实体。访问权限由业界领先的 Supabase Auth
                      进行身份认证，确保您的数据只属于您自己。
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
