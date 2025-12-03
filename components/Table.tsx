import { ReactNode } from "react";

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export default function Table({ headers, children }: TableProps) {
    return (
        <table className="w-full border-collapse border border-gray-700">
            <thead>
                <tr className="bg-gray-800">
                    {headers.map((h, i) => (
                        <th key={i} className="border border-gray-700 p-2">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
    );
}
