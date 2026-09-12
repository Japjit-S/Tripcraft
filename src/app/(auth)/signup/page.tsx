import Link from 'next/link';
import { Home } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex justify-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-blue-600">
          <Home className="w-8 h-8" />
          <span>Roamwise</span>
        </Link>
      </div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
        Create a new account
      </h2>
      <p className="mt-2 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Sign in here
        </Link>
      </p>

      <div className="mt-8 bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
        <form className="space-y-6" action="#" method="POST">
          <div>
            <label className="block text-sm font-medium text-slate-700">Display name</label>
            <div className="mt-1">
              <input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email address</label>
            <div className="mt-1">
              <input type="email" required className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <div className="mt-1">
              <input type="password" required className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div>
            <Link href="/planner" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
