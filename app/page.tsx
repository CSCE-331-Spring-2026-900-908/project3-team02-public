import Link from "next/link";

export default function Home() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-white font-sans">
			<main className="w-full max-w-4xl mx-auto px-10 py-12">
				<div className="flex flex-col items-center gap-6">

					<h1 className="text-4xl font-semibold text-gray-900">POS System</h1>
					<p className="text-gray-600">Select a view to continue</p>

					<div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
						<Link href="/cashier" className="block h-40 rounded-2xl shadow-md bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold transform transition hover:scale-105">
							Cashier View
						</Link>
						<Link href="/manager" className="block h-40 rounded-2xl shadow-md bg-green-600 text-white flex items-center justify-center text-2xl font-semibold transform transition hover:scale-105">
							Manager View
						</Link>
						<Link href="/customer" className="block h-40 rounded-2xl shadow-md bg-gray-100 text-gray-900 flex items-center justify-center text-2xl font-semibold transform transition hover:scale-105">
							Customer View
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
