import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const deletePostgresSchema = z.object({
	projectName: z.string().min(1, {
		message: "Database name is required",
	}),
});

type DeletePostgres = z.infer<typeof deletePostgresSchema>;

interface Props {
	postgresId: string;
}

export const DeletePostgres = ({ postgresId }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const { mutateAsync, isLoading } = api.postgres.remove.useMutation();
	const { data } = api.postgres.one.useQuery(
		{ postgresId },
		{ enabled: !!postgresId },
	);
	const { push } = useRouter();
	const form = useForm<DeletePostgres>({
		defaultValues: {
			projectName: "",
		},
		resolver: zodResolver(deletePostgresSchema),
	});

	const onSubmit = async (formData: DeletePostgres) => {
		const expectedName = `${data?.name}/${data?.appName}`;
		if (formData.projectName === expectedName) {
			await mutateAsync({ postgresId })
				.then((data) => {
					push(`/dashboard/project/${data?.projectId}`);
					toast.success("Database deleted successfully");
					setIsOpen(false);
				})
				.catch(() => {
					toast.error("Error deleting the database");
				});
		} else {
			form.setError("projectName", {
				message: "Database name does not match",
			});
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" isLoading={isLoading}>
					<TrashIcon className="size-4 text-muted-foreground" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-screen overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Are you absolutely sure?</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete the
						database. If you are sure please enter the database name to delete
						this database.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							id="hook-form-delete-postgres"
							className="grid w-full gap-4"
						>
							<FormField
								control={form.control}
								name="projectName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											To confirm, type "{data?.name}/{data?.appName}" in the box
											below
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter database name to confirm"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</div>
				<DialogFooter>
					<Button
						variant="secondary"
						onClick={() => {
							setIsOpen(false);
						}}
					>
						Cancel
					</Button>
					<Button
						isLoading={isLoading}
						form="hook-form-delete-postgres"
						type="submit"
						variant="destructive"
					>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
