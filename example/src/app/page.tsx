import { Header } from '@/app/Header';
import { Images } from '@/app/Images';

export default function Example() {
  return (
    <div className="bg-white">
      <Header />
      <main className="isolate">
        {/* Feature section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
          <Images />
        </div>
      </main>
    </div>
  );
}
