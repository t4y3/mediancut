import Link from 'next/link';

type Photo = {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
};

async function getImages() {
  const res = await fetch('https://picsum.photos/v2/list?page=10', {
    cache: 'force-cache',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch photos');
  }

  const data = await res.json();
  return data as Photo[];
}

export const Images = async () => {
  const files = await getImages();
  return (
    <ul
      role="list"
      className="columns-2 gap-x-4 *:mt-4 sm:columns-3 sm:gap-x-6 sm:*:mt-6 lg:columns-4 xl:gap-x-8 xl:*:mt-8"
    >
      {files.map((file) => {
        // width, heightを最大400pxまでに収める
        const width = Math.min(file.width, 400);
        const height = Math.floor((file.height / file.width) * width);
        const src = `https://picsum.photos/id/${file.id}/${width}/${height}`
        return (
          <li key={file.download_url} className="relative first:mt-0">
            <Link
              href={`/images/${file.id}`}
              className="block group aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100"
            >
              <img
                src={src}
                width={file.width}
                height={file.height}
                alt=""
                className="pointer-events-none object-cover group-hover:opacity-75"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
};