import { Head, Html, Main, NextScript } from 'next/document'

const Document = () => {
	return (
		<Html lang="en" className="h-full bg-dark-800 antialiased">
			<Head />
			<body className="flex min-h-full flex-col items-center justify-center">
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}

export default Document
