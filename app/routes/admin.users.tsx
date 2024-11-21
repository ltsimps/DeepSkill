import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { prisma } from "~/utils/db.server";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export async function loader() {
  const users = await prisma.user.findMany({
    include: {
      roles: true,
      progressions: {
        include: {
          problem: true,
        },
      },
      sessions: {
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return json({ users });
}

export async function action({ request }) {
  const formData = await request.formData();
  const userId = formData.get("userId");
  const action = formData.get("action");

  if (action === "reset-stats") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: 0,
        level: 1,
        streak: 0,
        lastPractice: null,
      },
    });

    // Delete today's sessions
    await prisma.practiceSession.deleteMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    // Reset problem progressions
    await prisma.problemProgression.updateMany({
      where: { userId },
      data: {
        attempts: 0,
        timeSpent: 0,
        solved: null,
        consecutiveCorrect: 0,
        lastSolution: null,
        lastFeedback: null,
      },
    });
  }

  return json({ success: true });
}

export default function AdminUsers() {
  const { users } = useLoaderData();
  const fetcher = useFetcher();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Users</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 backdrop-blur-lg border border-purple-500/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role.name} variant="outline">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Level</p>
                  <p className="text-xl font-bold text-white">{user.level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">XP</p>
                  <p className="text-xl font-bold text-white">{user.xp}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Streak</p>
                  <p className="text-xl font-bold text-white">{user.streak}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Today's Problems</p>
                  <p className="text-xl font-bold text-white">{user.sessions.length}</p>
                </div>
              </div>

              <fetcher.Form method="post">
                <input type="hidden" name="userId" value={user.id} />
                <Button
                  type="submit"
                  name="action"
                  value="reset-stats"
                  variant="destructive"
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/20"
                >
                  {fetcher.state !== "idle" ? "Resetting..." : "Reset Stats"}
                </Button>
              </fetcher.Form>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
