import { DropdownMenu, Button, Flex } from "@radix-ui/themes";

const SingleSelector = ({
	defaultValue,
	value,
	onValueChange,
	disabled = false,
	groups = [],
	options = [],
	placeholder = "Select an option",
	...props
}) => {
	// Helper to get label by value
	const getLabel = (val) => {
		if (!val) return "";
		if (groups.length > 0) {
			for (const group of groups) {
				const found = group.options.find(opt => opt.value === val);
				if (found) return found.label;
			}
		}
		const found = options.find(opt => opt.value === val);
		return found ? found.label : "";
	};

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Button
					className="w-[auto] h-[32px] pt-2 pr-3 pb-2 pl-3 gap-2 rounded-lg border border-[#3B3D45] bg-background flex items-center text-foreground text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:ring-accent/40 justify-between"
					style={{ border: '1px solid hsl(var(--border))' }}
					disabled={disabled}
					{...props}
				>
					<Flex align="center" gap="2">
						{options.find(opt => opt.value === value)?.icon && (
							<span className="text-muted-foreground">
								{options.find(opt => opt.value === value)?.icon}
							</span>
						)}
						<span className="text-[14px]">
							{getLabel(value) || getLabel(defaultValue) || placeholder}
						</span>
					</Flex>
					<DropdownMenu.TriggerIcon />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content color='gray' className="bg-background border border-border rounded-[12px] text-foreground min-w-[200px] z-[10000]">
				{/* Render ungrouped options */}
				{groups.length === 0 && options.map((option, idx) => (
					<DropdownMenu.Item
						key={option.value || idx}
						disabled={option.disabled}
						className={`px-4 py-2 text-[14px] font-medium flex items-center rounded-[8px] transition-colors ${
							value === option.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent focus:bg-accent'
						} text-foreground ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
						onClick={() => onValueChange && onValueChange(option.value)}
					>
						<Flex align="center" gap="2" className="w-full">
							{option.icon && (
								<span className="text-muted-foreground">
									{option.icon}
								</span>
							)}
							<span>{option.label}</span>
							{option.duration && (
								<span className="ml-auto text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
									{option.duration}
								</span>
							)}
							{value === option.value && (
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
									<path d="M4 8.5L7 11.5L12 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							)}
						</Flex>
					</DropdownMenu.Item>
				))}
				{/* Render grouped options as submenus */}
				{groups.length > 0 && groups.map((group, groupIdx) => (
					<DropdownMenu.Sub key={group.label || groupIdx}>
						<DropdownMenu.SubTrigger className="px-4 py-2 text-[14px] font-medium flex items-center rounded-[8px] hover:bg-accent focus:bg-accent text-foreground justify-between">
							{group.label}
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent className="bg-background border border-border rounded-[12px] text-foreground min-w-[180px] z-[10000]">
							{group.options.map((option, optIdx) => (
								<DropdownMenu.Item
									key={option.value || optIdx}
									disabled={option.disabled}
									className={`px-4 py-2 text-[14px] font-medium flex items-center rounded-[8px] transition-colors ${
										value === option.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent focus:bg-accent'
									} text-foreground ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
									onClick={() => onValueChange && onValueChange(option.value)}
								>
									<Flex align="center" gap="2" className="w-full">
										{option.icon && (
											<span className="text-muted-foreground">
												{option.icon}
											</span>
										)}
										<span>{option.label}</span>
										{option.duration && (
											<span className="ml-auto text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
												{option.duration}
											</span>
										)}
										{value === option.value && (
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
												<path d="M4 8.5L7 11.5L12 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										)}
									</Flex>
								</DropdownMenu.Item>
							))}
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
				))}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
};

export default SingleSelector;