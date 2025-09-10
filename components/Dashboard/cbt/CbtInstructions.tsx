"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CbtInstructions({ onStart }: { onStart: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
        >
            <Card className="max-w-2xl shadow-lg p-6 rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Test Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-700">
                    <ul className="list-disc pl-6 space-y-2">
                        <li>You have limited time to complete the test.</li>
                        <li>Each question has four options, only one is correct.</li>
                        <li>You cannot go back once you submit.</li>
                    </ul>
                    <Button className="w-full mt-4" onClick={onStart}>
                        Start Test
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
