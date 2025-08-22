"use client";
import type { RhymeResult } from "../lib/searchRhyme";

import {
	Container,
	TextInput,
	Button,
	Card,
	Group,
	Stack,
	Title,
	Text,
	Alert,
	Badge,
	Grid,
	Switch,
	Center,
} from "@mantine/core";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { IconSearch, IconAlertCircle } from "@tabler/icons-react";

interface SearchParams {
	text: string;
	searchType: "rhyme" | "alliteration";
}

export default function HomePage() {
	const [text, setText] = useState("");
	const [searchType, setSearchType] = useState<"rhyme" | "alliteration">(
		"rhyme",
	);
	const [displayLimits, setDisplayLimits] = useState<Record<string, number>>(
		{},
	);

	const searchMutation = useMutation({
		mutationFn: async ({ text, searchType }: SearchParams) => {
			const endpoint =
				searchType === "rhyme" ? "/api/rhyme" : "/api/alliteration";
			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ text }),
			});

			if (!response.ok) {
				throw new Error("検索に失敗しました");
			}

			return response.json() as Promise<RhymeResult>;
		},
	});

	const handleSearch = () => {
		if (!text.trim()) return;
		searchMutation.reset();
		searchMutation.mutate({ text, searchType });
		setDisplayLimits({});
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	const handleLoadMore = (length: string) => {
		setDisplayLimits((prev) => ({
			...prev,
			[length]: (prev[length] || 100) + 100,
		}));
	};

	return (
		<Container size="xl" py="xl">
			<Stack>
				<Center>
					<Title order={1} size="h2">
						韻システム
					</Title>
				</Center>
				<Card withBorder radius="md">
					<Stack>
						<TextInput
							placeholder="例: 韻システム"
							value={text}
							onChange={(e) => {
								setText(e.currentTarget.value);
								searchMutation.reset();
							}}
							onKeyPress={handleKeyPress}
							size="md"
							leftSection={<IconSearch size={16} />}
						/>

						<Group justify="space-between" align="flex-end">
							<Switch
								label="頭韻検索"
								checked={searchType === "alliteration"}
								onChange={(e) => {
									setSearchType(
										e.currentTarget.checked ? "alliteration" : "rhyme",
									);
									searchMutation.reset();
								}}
								size="md"
							/>

							<Button
								onClick={handleSearch}
								loading={searchMutation.isPending}
								disabled={!text.trim()}
								size="md"
							>
								検索
							</Button>
						</Group>
					</Stack>
				</Card>

				{searchMutation.isError && (
					<Alert
						icon={<IconAlertCircle size={16} />}
						title="エラー"
						color="red"
						variant="light"
					>
						{searchMutation.error instanceof Error
							? searchMutation.error.message
							: "検索中にエラーが発生しました"}
					</Alert>
				)}

				{searchMutation.data && (
					<Stack gap="md">
						<Card withBorder radius="md">
							<Stack gap="sm">
								<Group>
									<Text size="sm" c="dimmed">
										読み:
									</Text>
									<Text size="sm">{searchMutation.data.yomi}</Text>
								</Group>
								<Group>
									<Text size="sm" c="dimmed">
										母音列:
									</Text>
									<Text size="sm" fw="bold">
										{searchMutation.data.vowels}
									</Text>
								</Group>
							</Stack>
						</Card>

						{Object.entries(searchMutation.data.results).length > 0 ? (
							<Stack gap="md">
								{Object.entries(searchMutation.data.results)
									.sort(([a], [b]) => Number(b) - Number(a))
									.map(([length, words]) => {
										const currentLimit = displayLimits[length] || 100;
										const displayWords = words.slice(0, currentLimit);
										const hasMore = words.length > currentLimit;
										const remainingCount = words.length - currentLimit;

										return (
											<Card key={length} withBorder radius="md">
												<Stack gap="sm">
													<Group>
														<Badge color="blue" size="lg">
															{length}文字一致
														</Badge>
														<Text size="sm" c="dimmed">
															{displayWords.length} / {words.length}件
														</Text>
													</Group>
													<Grid>
														{displayWords.map((word) => (
															<Grid.Col
																key={`${word.surface}-${word.yomi}-${word.vowels}`}
																span={{ base: 12, xs: 6, sm: 4, md: 3 }}
															>
																<Card padding="sm" withBorder>
																	<Stack gap={4}>
																		<Text size="sm" fw="bold">
																			{word.surface}
																		</Text>
																		<Text size="xs" c="dimmed">
																			{word.yomi}
																		</Text>
																		<Text size="xs" c="blue">
																			{word.vowels}
																		</Text>
																	</Stack>
																</Card>
															</Grid.Col>
														))}
													</Grid>
													{hasMore && (
														<Center>
															<Button
																variant="light"
																onClick={() => handleLoadMore(length)}
																size="sm"
															>
																さらに見る ({remainingCount}件)
															</Button>
														</Center>
													)}
												</Stack>
											</Card>
										);
									})}
							</Stack>
						) : (
							<Card withBorder radius="md">
								<Text c="dimmed" ta="center">
									一致する単語が見つかりませんでした
								</Text>
							</Card>
						)}
					</Stack>
				)}
			</Stack>
		</Container>
	);
}
