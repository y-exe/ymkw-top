"use client";

export default function FooterSection({
    tagline = "Discord Server Analytics Dashboard",
    status = [
        { text: "1.5M+", subtext: "Messages" },
        { text: "20+", subtext: "Active Channels" },
        { text: "24/7", subtext: "Monitoring" },
    ],
    menuItems = [
        {
            title: "Dashboard",
            links: [
                { text: "Overview", url: "/" },
                { text: "Monthly Analytics", url: "/month/2025/3" },
                { text: "All Time Ranking", url: "/no-snapshots" },
            ],
        },
        {
            title: "About",
            links: [
                { text: "Terms of Service", url: "/terms" },
                { text: "Privacy Policy", url: "/privacy" },
            ],
        },
        {
            title: "Community",
            links: [
                { text: "Discord Server", url: "https://discord.com/invite/Cn7GV9rn7Y" },
                { text: "YouTube Channel", url: "https://www.youtube.com/@YamakawaTeruki" },
            ],
        },
    ],
    copyright = "© 2025 ymkw.top. All rights reserved.",
    bottomLinks = [
        { text: "Terms", url: "/terms" },
        { text: "Privacy", url: "/privacy" },
    ],
}) {
    return (
        <footer className="bg-background py-16 border-t border-border">
            <div className="container mx-auto px-6 max-w-7xl">
                {/* --- Branding & Status --- */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-10">
                    {/* Logo + tagline */}
                    <div className="max-w-sm text-center lg:text-left">
                        <img
                            src="https://i.ibb.co/Qv4SzXdc/fd6ab2714672b2efc0b4ebb9c4f93eaf-1.webp"
                            alt="ymkw.top logo"
                            title="ymkw.top"
                            width={100}
                            height={100}
                            className="h-auto w-12 mx-auto lg:mx-0 mb-4 rounded-xl shadow-sm"
                        />
                        <div className="lg:col-span-2">
                            <h3 className="mb-3 text-sm font-semibold text-foreground">
                                About ymkw.top
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                やまかわてるき鯖（ymkw.top）は、サーバー内の活動量、ランキング、統計情報を可視化する公認WEBダッシュボードです。参加者の発言数推移やサーバー全体のトレンドを簡単に確認できます。
                            </p>
                        </div>
                    </div>

                    {/* --- Menu Links (multi-column) --- */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 lg:ml-20">
                        {menuItems.map((section, sectionIdx) => (
                            <div key={sectionIdx}>
                                <h3 className="mb-3 text-sm font-semibold text-foreground">
                                    {section.title}
                                </h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {section.links.map((link, linkIdx) => (
                                        <li
                                            key={linkIdx}
                                            className="hover:text-primary transition-colors"
                                        >
                                            <a href={link.url}>{link.text}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Bottom Bar --- */}
                <div className="border-t border-border mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
                    <p>{copyright}</p>
                    <ul className="flex flex-wrap gap-4">
                        {bottomLinks.map((link, linkIdx) => (
                            <li
                                key={linkIdx}
                                className="hover:text-primary underline underline-offset-4 transition-colors"
                            >
                                <a href={link.url}>{link.text}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
}
