"use client";

import { useState } from "react";
import type { projects, assets, units } from "@/lib/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddAssetDialog } from "./add-asset-dialog";
import { AddUnitDialog } from "./add-unit-dialog";
import { formatDate, formatPrice, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, ExternalLink, Plus } from "lucide-react";
import {
  deleteAsset,
  deleteUnit,
  updateUnitStatus,
  updateProject,
} from "@/modules/project/server";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Project = typeof projects.$inferSelect;
type Asset = typeof assets.$inferSelect;
type Unit = typeof units.$inferSelect;

export function ProjectDetail({
  project,
}: {
  project: Project & { assets: Asset[]; units: Unit[] };
}) {
  const router = useRouter();

  async function handlePublish() {
    await updateProject(project.id, {
      status: project.status === "draft" ? "published" : "draft",
    });
    router.refresh();
  }

  async function handleDeleteAsset(assetId: string) {
    await deleteAsset(assetId);
    router.refresh();
  }

  async function handleDeleteUnit(unitId: string) {
    await deleteUnit(unitId);
    router.refresh();
  }

  async function handleUnitStatus(
    unitId: string,
    status: "available" | "reserved" | "sold",
  ) {
    await updateUnitStatus(unitId, status);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <Badge
              variant={project.status === "published" ? "default" : "secondary"}
            >
              {project.status}
            </Badge>
          </div>
          {project.location && (
            <p className="text-sm text-muted-foreground mt-1">
              {project.location}
            </p>
          )}
        </div>
        <Button
          onClick={handlePublish}
          variant={project.status === "published" ? "outline" : "default"}
        >
          {project.status === "published" ? "Unpublish" : "Publish"}
        </Button>
      </div>

      {project.heroImageUrl && (
        <div className="rounded-lg overflow-hidden h-48 bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.heroImageUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">
            Assets ({project.assets.length})
          </TabsTrigger>
          <TabsTrigger value="units">
            Units ({project.units.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.description && (
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {formatDate(project.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Assets</p>
                  <p className="text-sm font-medium">{project.assets.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Units</p>
                  <p className="text-sm font-medium">{project.units.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Link href={`/projects/${project.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="size-4 mr-1" />
                View Public Hub
              </Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Assets</h3>
            <AddAssetDialog projectId={project.id} projectSlug={project.slug} />
          </div>
          {project.assets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 gap-3">
                <p className="text-muted-foreground text-sm">
                  No assets yet. Add renders, films, floorplans, or brochures.
                </p>
                <AddAssetDialog
                  projectId={project.id}
                  projectSlug={project.slug}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {project.assets.map((asset) => (
                <Card key={asset.id}>
                  <CardContent className="p-3">
                    <div className="rounded-md overflow-hidden h-32 bg-muted mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{asset.title}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {asset.type}
                        </Badge>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteAsset(asset.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Units</h3>
            <AddUnitDialog projectId={project.id} projectSlug={project.slug} />
          </div>
          {project.units.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 gap-3">
                <p className="text-muted-foreground text-sm">
                  No units yet. Add available units.
                </p>
                <AddUnitDialog
                  projectId={project.id}
                  projectSlug={project.slug}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Beds</TableHead>
                      <TableHead>Baths</TableHead>
                      <TableHead>Area (sqft)</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-mono text-sm">
                          {unit.code}
                        </TableCell>
                        <TableCell className="text-sm">
                          {unit.name || "—"}
                        </TableCell>
                        <TableCell>{unit.beds ?? "—"}</TableCell>
                        <TableCell>{unit.baths ?? "—"}</TableCell>
                        <TableCell>{formatNumber(unit.areaSqft)}</TableCell>
                        <TableCell>{formatPrice(unit.price)}</TableCell>
                        <TableCell>
                          <Select
                            value={unit.status}
                            onValueChange={(v) =>
                              v &&
                              handleUnitStatus(
                                unit.id,
                                v as "available" | "reserved" | "sold",
                              )
                            }
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">
                                Available
                              </SelectItem>
                              <SelectItem value="reserved">Reserved</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteUnit(unit.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
