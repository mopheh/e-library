"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CbtResult({ score, total }: { score: number; total: number }) {
    return (
        <Card className="max-w-xl mx-auto p-6 text-center">
            <CardHeader>
                <CardTitle className="text-2xl">Test Result</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg">You scored</p>
                <p className="text-4xl font-bold mt-2">
                    {score} / {total}
                </p>
                <p className="mt-3 text-gray-600">
                    {score / total >= 0.5 ? "🎉 Great job!" : "💡 Keep practicing!"}
                </p>
            </CardContent>
        </Card>
    );
}
