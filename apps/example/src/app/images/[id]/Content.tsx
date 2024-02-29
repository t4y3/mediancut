'use client';

import { CompareImage } from '@/app/CompareImage';
import {
  PhotoIcon,
  UserCircleIcon,
} from '@heroicons/react/20/solid';
import {useEffect, useState} from 'react';
import { Canvas } from '@/app/images/[id]/Canvas';
import init, { reduce }  from "mediancut-wasm";

enum Channel {
  R,
  G,
  B,
}

// r, g, b, uses
type Colors = [number, number, number, number];

type Bucket = {
  colors: Colors[];
  total: number;
  channel: Channel;
  minR: number;
  minG: number;
  minB: number;
  maxR: number;
  maxG: number;
  maxB: number;
};

// const invoice = {
//   subTotal: '$8,800.00',
//   tax: '$1,760.00',
//   total: '$10,560.00',
//   items: [
//     {
//       id: 1,
//       title: 'Logo redesign',
//       description: 'New logo and digital asset playbook.',
//       hours: '20.0',
//       rate: '$100.00',
//       price: '$2,000.00',
//     },
//     {
//       id: 2,
//       title: 'Website redesign',
//       description: 'Design and program new company website.',
//       hours: '52.0',
//       rate: '$100.00',
//       price: '$5,200.00',
//     },
//     {
//       id: 3,
//       title: 'Business cards',
//       description: 'Design and production of 3.5" x 2.0" business cards.',
//       hours: '12.0',
//       rate: '$100.00',
//       price: '$1,200.00',
//     },
//     {
//       id: 4,
//       title: 'T-shirt design',
//       description: 'Three t-shirt design concepts.',
//       hours: '4.0',
//       rate: '$100.00',
//       price: '$400.00',
//     },
//   ],
// };

export const Content = ({
  image,
}: {
  image: {
    download_url: string;
    width: number;
    height: number;
    author: string;
    url: string;
  };
}) => {
  const [imageData, setImageData] = useState<ImageData | null>(
    null,
  );
  const [reducedImageData, setReducedImageData] = useState<ImageData | null>(
    null,
  );
  const [bucketsPerStep, setBucketsPerStep] = useState<[Bucket[]] | []>([]);
  const worker = new Worker(new URL('./worker', import.meta.url));

  worker.addEventListener('message', (response) => {
    setReducedImageData(response.data.imageData);
    setBucketsPerStep(response.data.bucketsPerStep);
  });



  useEffect(() => {
if (imageData?.data) {
  console.warn(imageData.data);

  init().then((m) => {
    const res = reduce(imageData.data, 12);
  });
    }

  }, [imageData]);

  // worker.postMessage({ imageData, size }, [imageData.data.buffer]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-2xl grid-cols-1 grid-rows-1 items-start gap-x-8 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        {/* Invoice summary */}
        <div className="lg:col-start-3 lg:row-end-1 space-y-6">
          <div>
            <div className="rounded-lg bg-gray-50 shadow-sm ring-1 ring-gray-900/5">
              <img
                src={image.download_url}
                width={image.width}
                height={image.height}
                alt=""
                crossOrigin="anonymous"
                onLoad={(e) => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = image.width;
                  canvas.height = image.height;
                  if (!ctx) {
                    return;
                  }
                  ctx.drawImage(e.target as HTMLImageElement, 0, 0);
                  const imageData = ctx.getImageData(
                    0,
                    0,
                    image.width,
                    image.height,
                  );
                  // worker.postMessage({ imageData, size: 12 }, [
                  //   imageData.data.buffer,
                  // ]);
                  setImageData(imageData);
                }}
              />
            </div>
          </div>
          <div>
            <h2 className="sr-only">Summary</h2>
            <div className="rounded-lg bg-gray-50 shadow-sm ring-1 ring-gray-900/5">
              <dl className="flex flex-wrap">
                <div className="flex-auto pl-6 pt-6">
                  <dt className="text-sm font-semibold leading-6 text-gray-900">
                    Author
                  </dt>
                  <dd className="mt-1 text-base font-semibold leading-6 text-gray-900">
                    {image.author}
                  </dd>
                </div>
                {/*<div className="flex-none self-end px-6 pt-4">*/}
                {/*  <dt className="sr-only">Status</dt>*/}
                {/*  <dd className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-600 ring-1 ring-inset ring-green-600/20">*/}
                {/*    Paid*/}
                {/*  </dd>*/}
                {/*</div>*/}
                <div className="mt-6 flex w-full flex-none gap-x-4 border-t border-gray-900/5 px-6 pt-6">
                  <dt className="flex-none">
                    <span className="sr-only">Client</span>
                    <UserCircleIcon
                      className="h-6 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </dt>
                  <dd className="text-sm font-medium leading-6 text-gray-900">
                    {image.author}
                  </dd>
                </div>
                {/*<div className="mt-4 flex w-full flex-none gap-x-4 px-6">*/}
                {/*  <dt className="flex-none">*/}
                {/*    <span className="sr-only">Due date</span>*/}
                {/*    <CalendarDaysIcon*/}
                {/*      className="h-6 w-5 text-gray-400"*/}
                {/*      aria-hidden="true"*/}
                {/*    />*/}
                {/*  </dt>*/}
                {/*  <dd className="text-sm leading-6 text-gray-500">*/}
                {/*    {image.download_url}*/}
                {/*  </dd>*/}
                {/*</div>*/}
                <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
                  <dt className="flex-none">
                    <span className="sr-only">Status</span>
                    <PhotoIcon
                      className="h-6 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </dt>
                  <dd className="text-sm leading-6 text-gray-500">
                    {image.width} * {image.height}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 border-t border-gray-900/5 px-6 py-6">
                <a
                  href={image.url}
                  target="_blank"
                  className="text-sm font-semibold leading-6 text-gray-900"
                >
                  Download photo <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice */}
        <div className="-mx-4 px-4 py-8 shadow-sm ring-1 ring-gray-900/5 sm:mx-0 sm:rounded-lg sm:px-8 sm:pb-14 lg:col-span-2 lg:row-span-2 lg:row-end-2 xl:px-16 xl:pb-20 xl:pt-16">
          <div
            className="relative"
            style={{
              aspectRatio: `${image.width}/${image.height}`,
            }}
          >
            <CompareImage>
              <img
                src={image.download_url}
                width={image.width}
                height={image.height}
                alt=""
                className="pointer-events-none object-cover group-hover:opacity-75 absolute inset-0"
              />
              {reducedImageData && (
                <div className="absolute inset-0">
                  <Canvas
                    width={reducedImageData.width}
                    height={reducedImageData.height}
                    imageData={reducedImageData}
                  />
                </div>
              )}
            </CompareImage>
          </div>
          {/*<h2 className="text-base font-semibold leading-6 text-gray-900 mt-6">*/}
          {/*  Invoice*/}
          {/*</h2>*/}
          <dl className="mt-6 grid grid-cols-1 text-sm leading-6 sm:grid-cols-2">
            {/*<div className="sm:pr-4">*/}
            {/*  <dt className="inline text-gray-500">Issued on</dt>{' '}*/}
            {/*  <dd className="inline text-gray-700">*/}
            {/*    <time dateTime="2023-23-01">January 23, 2023</time>*/}
            {/*  </dd>*/}
            {/*</div>*/}
            {/*<div className="mt-2 sm:mt-0 sm:pl-4">*/}
            {/*  <dt className="inline text-gray-500">Due on</dt>{' '}*/}
            {/*  <dd className="inline text-gray-700">*/}
            {/*    <time dateTime="2023-31-01">January 31, 2023</time>*/}
            {/*  </dd>*/}
            {/*</div>*/}
            <div className="mt-6 border-t border-gray-900/5 pt-6 sm:pr-4">
              <dt className="font-semibold text-gray-900">From</dt>
              <dd className="mt-2 text-gray-500">
                {/*<span className="font-medium text-gray-900">Acme, Inc.</span>*/}
                {bucketsPerStep[0]?.[0].total.toLocaleString()} colors
              </dd>
            </div>
            <div className="mt-8 sm:mt-6 sm:border-t sm:border-gray-900/5 sm:pl-4 sm:pt-6">
              <dt className="font-semibold text-gray-900">To</dt>
              <dd className="mt-2 text-gray-500">
                {/*<span className="font-medium text-gray-900">Tuple, Inc</span>*/}
                {12} colors
              </dd>
            </div>
          </dl>
          {/*<table className="mt-16 w-full whitespace-nowrap text-left text-sm leading-6">*/}
          {/*  <colgroup>*/}
          {/*    <col className="w-full" />*/}
          {/*    <col />*/}
          {/*    <col />*/}
          {/*    <col />*/}
          {/*  </colgroup>*/}
          {/*  <thead className="border-b border-gray-200 text-gray-900">*/}
          {/*    <tr>*/}
          {/*      <th scope="col" className="px-0 py-3 font-semibold">*/}
          {/*        Steps*/}
          {/*      </th>*/}
          {/*      <th*/}
          {/*        scope="col"*/}
          {/*        className="hidden py-3 pl-8 pr-0 text-right font-semibold sm:table-cell"*/}
          {/*      >*/}
          {/*        Hours*/}
          {/*      </th>*/}
          {/*      <th*/}
          {/*        scope="col"*/}
          {/*        className="hidden py-3 pl-8 pr-0 text-right font-semibold sm:table-cell"*/}
          {/*      >*/}
          {/*        Rate*/}
          {/*      </th>*/}
          {/*      <th*/}
          {/*        scope="col"*/}
          {/*        className="py-3 pl-8 pr-0 text-right font-semibold"*/}
          {/*      >*/}
          {/*        Price*/}
          {/*      </th>*/}
          {/*    </tr>*/}
          {/*  </thead>*/}
          {/*  <tbody>*/}
          {/*    {invoice.items.map((item) => (*/}
          {/*      <tr key={item.id} className="border-b border-gray-100">*/}
          {/*        <td className="max-w-0 px-0 py-5 align-top">*/}
          {/*          <div className="truncate font-medium text-gray-900">*/}
          {/*            {item.title}*/}
          {/*          </div>*/}
          {/*          <div className="truncate text-gray-500">*/}
          {/*            {item.description}*/}
          {/*          </div>*/}
          {/*        </td>*/}
          {/*        <td className="hidden py-5 pl-8 pr-0 text-right align-top tabular-nums text-gray-700 sm:table-cell">*/}
          {/*          {item.hours}*/}
          {/*        </td>*/}
          {/*        <td className="hidden py-5 pl-8 pr-0 text-right align-top tabular-nums text-gray-700 sm:table-cell">*/}
          {/*          {item.rate}*/}
          {/*        </td>*/}
          {/*        <td className="py-5 pl-8 pr-0 text-right align-top tabular-nums text-gray-700">*/}
          {/*          {item.price}*/}
          {/*        </td>*/}
          {/*      </tr>*/}
          {/*    ))}*/}
          {/*    {bucketsPerStep.map((buckets, i) => (*/}
          {/*      <tr key={i} className="border-b border-gray-100">*/}
          {/*        <td className="max-w-0 px-0 py-5 align-top">*/}
          {/*          <div className="truncate font-medium text-gray-900">*/}
          {/*            {buckets.length}*/}
          {/*          </div>*/}
          {/*          <div className="truncate text-gray-500">*/}
          {/*            {buckets.length}*/}
          {/*          </div>*/}
          {/*        </td>*/}
          {/*        <td className="hidden py-5 pl-8 pr-0 text-right align-top tabular-nums text-gray-700 sm:table-cell">*/}
          {/*          {buckets.length}*/}
          {/*        </td>*/}
          {/*        <td className="hidden py-5 pl-8 pr-0 text-right align-top tabular-nums text-gray-700 sm:table-cell">*/}
          {/*          {buckets.length}*/}
          {/*        </td>*/}
          {/*        <td className="py-5 pl-8 pr-0 text-right align-top tabular-nums text-gray-700">*/}
          {/*          {buckets.length}*/}
          {/*        </td>*/}
          {/*      </tr>*/}
          {/*    ))}*/}
          {/*  </tbody>*/}
          {/*  <tfoot>*/}
          {/*    <tr>*/}
          {/*      <th*/}
          {/*        scope="row"*/}
          {/*        className="px-0 pb-0 pt-6 font-normal text-gray-700 sm:hidden"*/}
          {/*      >*/}
          {/*        Subtotal*/}
          {/*      </th>*/}
          {/*      <th*/}
          {/*        scope="row"*/}
          {/*        colSpan={3}*/}
          {/*        className="hidden px-0 pb-0 pt-6 text-right font-normal text-gray-700 sm:table-cell"*/}
          {/*      >*/}
          {/*        Subtotal*/}
          {/*      </th>*/}
          {/*      <td className="pb-0 pl-8 pr-0 pt-6 text-right tabular-nums text-gray-900">*/}
          {/*        {invoice.subTotal}*/}
          {/*      </td>*/}
          {/*    </tr>*/}
          {/*    <tr>*/}
          {/*      <th*/}
          {/*        scope="row"*/}
          {/*        className="pt-4 font-normal text-gray-700 sm:hidden"*/}
          {/*      >*/}
          {/*        Tax*/}
          {/*      </th>*/}
          {/*      <th*/}
          {/*        scope="row"*/}
          {/*        colSpan={3}*/}
          {/*        className="hidden pt-4 text-right font-normal text-gray-700 sm:table-cell"*/}
          {/*      >*/}
          {/*        Tax*/}
          {/*      </th>*/}
          {/*      <td className="pb-0 pl-8 pr-0 pt-4 text-right tabular-nums text-gray-900">*/}
          {/*        {invoice.tax}*/}
          {/*      </td>*/}
          {/*    </tr>*/}
          {/*    <tr>*/}
          {/*      <th*/}
          {/*        scope="row"*/}
          {/*        className="pt-4 font-semibold text-gray-900 sm:hidden"*/}
          {/*      >*/}
          {/*        Total*/}
          {/*      </th>*/}
          {/*      <th*/}
          {/*        scope="row"*/}
          {/*        colSpan={3}*/}
          {/*        className="hidden pt-4 text-right font-semibold text-gray-900 sm:table-cell"*/}
          {/*      >*/}
          {/*        Total*/}
          {/*      </th>*/}
          {/*      <td className="pb-0 pl-8 pr-0 pt-4 text-right font-semibold tabular-nums text-gray-900">*/}
          {/*        {invoice.total}*/}
          {/*      </td>*/}
          {/*    </tr>*/}
          {/*  </tfoot>*/}
          {/*</table>*/}
        </div>

        {/*<div>*/}
        {/*  {imageData?.data && <Canvas*/}
        {/*    width={imageData.width}*/}
        {/*    height={imageData.height}*/}
        {/*    imageData={new ImageData(*/}
        {/*      new Uint8ClampedArray(reduce(imageData.data, 12)),*/}
        {/*      imageData.width,*/}
        {/*      imageData.height,*/}
        {/*    )}*/}
        {/*  />}*/}
        {/*</div>*/}

        {/*<div className="lg:col-start-3">*/}
        {/*  /!* Activity feed *!/*/}
        {/*  <h2 className="text-sm font-semibold leading-6 text-gray-900">*/}
        {/*    Activity*/}
        {/*  </h2>*/}
        {/*  <ul role="list" className="mt-6 space-y-6">*/}
        {/*    <li className="relative flex gap-x-4"></li>*/}
        {/*  </ul>*/}
        {/*</div>*/}
      </div>
    </div>
  );
};
