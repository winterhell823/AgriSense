import { BellRing, Crop, MapPin, Settings2, ShieldUser, UserRound } from 'lucide-react';

const preferences = [
  'Receive weather-aware alerts',
  'Sync disease reports to cloud history',
  'Track crop-specific recommendations',
];

export default function ProfilePage() {
  return (
    <main className='mx-auto min-h-screen max-w-7xl px-4 pb-12 pt-28 md:px-6'>
      <div className='grid gap-6 lg:grid-cols-[0.95fr_1.05fr]'>
        <section className='rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-8'>
          <div className='flex items-center gap-3 text-primary'>
            <ShieldUser className='h-5 w-5' />
            <p className='text-xs uppercase tracking-[0.3em]'>Profile</p>
          </div>
          <div className='mt-5 flex items-center gap-4'>
            <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary'>
              <UserRound className='h-7 w-7' />
            </div>
            <div>
              <h1 className='text-4xl font-bold text-white'>Harshita Bawa</h1>
              <p className='mt-1 text-sm text-white/55'>Smallholder maize and tomato grower</p>
            </div>
          </div>

          <div className='mt-8 grid gap-3 sm:grid-cols-2'>
            <div className='rounded-2xl border border-white/10 bg-[#0b1310] p-4'>
              <div className='flex items-center gap-2 text-primary'>
                <MapPin className='h-4 w-4' />
                <p className='text-sm font-medium text-white'>Region</p>
              </div>
              <p className='mt-2 text-sm text-white/65'>New Delhi, India</p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-[#0b1310] p-4'>
              <div className='flex items-center gap-2 text-primary'>
                <Crop className='h-4 w-4' />
                <p className='text-sm font-medium text-white'>Managed crops</p>
              </div>
              <p className='mt-2 text-sm text-white/65'>Maize, tomatoes, beans</p>
            </div>
          </div>
        </section>

        <section className='space-y-6'>
          <div className='rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/25'>
            <div className='flex items-center gap-3 text-primary'>
              <Settings2 className='h-5 w-5' />
              <p className='text-xs uppercase tracking-[0.3em]'>Preferences</p>
            </div>
            <div className='mt-5 space-y-3'>
              {preferences.map(item => (
                <label key={item} className='flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1612]/95 px-4 py-4 text-sm text-white/70'>
                  <input type='checkbox' defaultChecked className='h-4 w-4 rounded border-white/20 bg-transparent text-primary focus:ring-primary' />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className='rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/25'>
            <div className='flex items-center gap-3 text-primary'>
              <BellRing className='h-5 w-5' />
              <p className='text-xs uppercase tracking-[0.3em]'>Notifications</p>
            </div>
            <p className='mt-4 text-sm leading-7 text-white/68'>
              Alert settings can trigger reminders for watering, disease follow-ups, and weather changes so you stay ahead of the next field decision.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
