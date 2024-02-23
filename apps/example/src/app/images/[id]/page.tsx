import { Header } from '@/app/Header';
import { Content } from '@/app/images/[id]/Content';
import Link from "next/link";

type Photo = {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
};

async function getImage(id: string) {
  const res = await fetch(`https://picsum.photos/id/${id}/info`);

  if (!res.ok) {
    throw new Error('Failed to fetch photos');
  }

  const data = await res.json();
  return data as Photo;
}

export default async function Page({ params }: { params: { id: string } }) {
  const image = await getImage(params.id);

  return (
    <div className="bg-white">
      <Header />
      <main className="isolate">
        <header className="relative isolate pt-16">
          <div
            className="absolute inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute left-16 top-full -mt-16 transform-gpu opacity-50 blur-3xl xl:left-1/2 xl:-ml-80">
              <div
                className="aspect-[1154/678] w-[72.125rem] bg-gradient-to-br from-[#FF80B5] to-[#9089FC]"
                style={{
                  clipPath:
                    'polygon(100% 38.5%, 82.6% 100%, 60.2% 37.7%, 52.4% 32.1%, 47.5% 41.8%, 45.2% 65.6%, 27.5% 23.4%, 0.1% 35.3%, 17.9% 0%, 27.7% 23.4%, 76.2% 2.5%, 74.2% 56%, 100% 38.5%)',
                }}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gray-900/5" />
          </div>

          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-x-8 lg:mx-0 lg:max-w-none">
              <div className="flex items-center gap-x-6">
                {/*<img*/}
                {/*  src="https://tailwindui.com/img/logos/48x48/tuple.svg"*/}
                {/*  alt=""*/}
                {/*  className="h-16 w-16 flex-none rounded-full ring-1 ring-gray-900/10"*/}
                {/*/>*/}
                {/*<h1>*/}
                {/*  <div className="text-sm leading-6 text-gray-500">*/}
                {/*    Invoice <span className="text-gray-700">#00011</span>*/}
                {/*  </div>*/}
                {/*  <div className="mt-1 text-base font-semibold leading-6 text-gray-900">*/}
                {/*    Tuple, Inc*/}
                {/*  </div>*/}
                {/*</h1>*/}
              </div>
              <div className="flex items-center gap-x-4 sm:gap-x-6">
                {/*<button*/}
                {/*  type="button"*/}
                {/*  className="hidden text-sm font-semibold leading-6 text-gray-900 sm:block"*/}
                {/*>*/}
                {/*  Copy URL*/}
                {/*</button>*/}
                <Link
                  href="/"
                  type="button"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Back
                </Link>
              </div>
            </div>
          </div>
        </header>

        <Content image={image}/>
      </main>
    </div>
  );
}
