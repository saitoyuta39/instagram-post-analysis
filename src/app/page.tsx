"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, PlayCircle, ImageIcon, CheckCircle2, AlertCircle, Lightbulb, TrendingUp, ArrowRight, Edit3, Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const scrollToResult = () => {
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

  const fetchPosts = async () => {
    if (!username) return;
    setIsLoadingPosts(true);
    setPosts([]);
    try {
      const response = await fetch(`/api/ig_posts/${username.replace("@", "")}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "投稿の取得に失敗しました");
      }
      const data = await response.json();
      setPosts(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const getPreviewUrl = (instagramUrl: string) => {
    if (!instagramUrl) return null;
    try {
      const urlObj = new URL(instagramUrl);
      if (urlObj.hostname.includes("instagram.com")) {
        const cleanPath = urlObj.pathname.endsWith("/") ? urlObj.pathname : `${urlObj.pathname}/`;
        return `https://www.instagram.com${cleanPath}media/?size=l`;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentImageIndex(index);
  };

  const handleSelectPost = (post: any) => {
    setSelectedPost(post);
    setEditedCaption(post.caption || "");
    setPreviewUrl(post.media_url);
    setIsPreviewing(true);
    // スクロールしてプレビューを表示
    setTimeout(() => {
      const previewElement = document.getElementById("preview-section");
      previewElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleAnalyze = async (postData?: any) => {
    const targetPost = postData || selectedPost;
    if (!targetPost && !url) return;

    setIsPreviewing(false); // 分析開始時にプレビューを閉じる
    setIsAnalyzing(true);
    setResult(null);
    setProgress(5);

    // プログレスバーのアニメーション（疑似）
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + (prev < 40 ? 5 : prev < 80 ? 2 : 1);
      });
    }, 800);

    try {
      // 複数画像（カルーセル）への対応
      let mediaUrls = [];
      if (targetPost?.children?.data) {
        mediaUrls = targetPost.children.data.map((c: any) => c.media_url);
      } else if (targetPost?.media_url) {
        mediaUrls = [targetPost.media_url];
      } else {
        mediaUrls = [url];
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_url: mediaUrls[0],
          media_urls: mediaUrls,
          caption: editedCaption || targetPost?.caption || "分析対象の投稿",
          media_type: targetPost?.media_type || (url.includes("reels") ? "VIDEO" : "IMAGE"),
          media_id: targetPost?.id,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) throw new Error("Request failed");
      
      const data = await response.json();
      
      if (data.status === "completed") {
        setResult(data);
        setProgress(100);
        setTimeout(() => {
          setIsAnalyzing(false);
          scrollToResult();
        }, 500);
      } else {
        throw new Error(data.summary || "解析に失敗しました");
      }
      
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error(error);
      setIsAnalyzing(false);
      alert(error.message || "解析中にエラーが発生しました。");
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans selection:bg-pink-100">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-pink-50/50 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[30%] w-[30%] rounded-full bg-blue-50/50 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
        {/* Hero Section */}
        <header className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium shadow-sm ring-1 ring-neutral-200">
              <TrendingUp className="h-3.5 w-3.5 text-pink-500" />
              <span>AI-Powered Instagram Insights</span>
            </div>
            <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
              Post <span className="bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">Analysis</span>
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-neutral-500 md:text-lg">
              Gemini 2.5 Pro があなたの投稿をプロ視点で分析。<br className="hidden md:block" />
              「伸びる」ための具体的なアクションを提案します。
            </p>
          </motion.div>
        </header>

        {/* Search & Selection Section */}
        <div className="mb-16 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10"
          >
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white p-1.5 shadow-lg shadow-neutral-200/50 ring-1 ring-neutral-200 focus-within:ring-2 focus-within:ring-pink-500/20">
                <div className="pl-4">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="ユーザー名を入力 (例: @username)..."
                  className="w-full border-none bg-transparent py-2.5 pr-4 text-base font-medium placeholder:text-neutral-300 focus:outline-none focus:ring-0"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchPosts()}
                />
              </div>
              <button
                onClick={fetchPosts}
                disabled={isLoadingPosts || !username}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-8 py-3.5 text-base font-bold text-white transition-all hover:bg-neutral-800 hover:shadow-md disabled:bg-neutral-300 md:w-auto"
              >
                {isLoadingPosts ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>投稿を取得</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Posts Grid */}
          <AnimatePresence>
            {posts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-bold">最近の投稿を選択</h2>
                  <span className="text-xs text-neutral-400">{posts.length} 件取得</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {posts.map((post, idx) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPost(post)}
                      className={cn(
                        "group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm ring-2 transition-all duration-300",
                        selectedPost?.id === post.id ? "ring-pink-500 shadow-pink-100" : "ring-transparent hover:ring-neutral-200"
                      )}
                    >
                      <img
                        src={post.media_url}
                        alt={post.caption || ""}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {post.media_type === "CAROUSEL_ALBUM" && (
                        <div className="absolute right-2 top-2 rounded-full bg-black/40 p-1 backdrop-blur-md">
                          <ImageIcon className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100 flex items-end p-3">
                        <p className="text-[10px] font-medium text-white line-clamp-2 leading-relaxed">
                          {post.caption || "No caption"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fallback URL Input */}
          <div className="relative py-6 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#fafafa] px-4 text-xs font-medium text-neutral-400">または URL で直接指定</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white p-1.5 shadow-md ring-1 ring-neutral-200 focus-within:ring-2 focus-within:ring-pink-500/20">
              <div className="pl-4">
                <PlayCircle className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="投稿のURLを入力 (例: https://www.instagram.com/p/...)"
                className="w-full border-none bg-transparent py-2.5 pr-4 text-base text-neutral-900 focus:outline-none focus:ring-0"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                const manualPost = { media_url: getPreviewUrl(url), caption: "", media_type: url.includes("reels") ? "VIDEO" : "IMAGE" };
                handleSelectPost(manualPost);
              }}
              disabled={isAnalyzing || !url}
              className="rounded-2xl bg-white px-8 py-3.5 font-bold shadow-sm ring-1 ring-neutral-200 transition-all hover:bg-neutral-50 disabled:bg-neutral-50 disabled:text-neutral-300 md:w-auto text-sm"
            >
              プレビューを確認
            </button>
          </div>
        </div>

        {/* Preview & Edit Section */}
        <AnimatePresence>
          {isPreviewing && selectedPost && (
            <motion.div
              id="preview-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-16 overflow-hidden"
            >
              <div className="rounded-[32px] bg-white p-8 shadow-xl shadow-neutral-200/50 ring-1 ring-neutral-100">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                      <Edit3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">分析内容の確認・編集</h2>
                      <p className="text-sm text-neutral-400">キャプションを編集して「もしも」のシミュレーションも可能です</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPreviewing(false)}
                    className="text-sm font-bold text-neutral-400 hover:text-neutral-900"
                  >
                    キャンセル
                  </button>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-neutral-100">
                    <img
                      src={selectedPost.media_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-400">
                        キャプション本文
                      </label>
                      <textarea
                        value={editedCaption}
                        onChange={(e) => setEditedCaption(e.target.value)}
                        placeholder="キャプションを入力してください..."
                        className="h-[calc(100%-28px)] w-full resize-none rounded-2xl border-none bg-neutral-50 p-4 text-sm leading-relaxed placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                      />
                    </div>
                    <button
                      onClick={() => handleAnalyze()}
                      className="group flex items-center justify-center gap-2 rounded-2xl bg-pink-600 px-8 py-4 text-lg font-black text-white shadow-lg shadow-pink-200 transition-all hover:bg-pink-700 hover:shadow-xl"
                    >
                      <Sparkles className="h-5 w-5" />
                      <span>この内容でAI解析を開始</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Display (Modal) */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md rounded-[32px] bg-white p-10 text-center shadow-2xl ring-1 ring-neutral-200"
              >
                <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-2xl shadow-lg ring-4 ring-pink-50">
                  <img
                    src={previewUrl || undefined}
                    alt="Analyzing..."
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/200x200/f5f5f5/666666?text=IG";
                    }}
                  />
                </div>
                <h3 className="mb-3 text-2xl font-black">AI解析を実行中...</h3>
                <p className="mb-8 text-sm text-neutral-400">プログラミングによる画像認識と<br />独自ナレッジベースで解析しています</p>
                
                <div className="mx-auto max-w-xs text-left">
                  <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 p-0.5 shadow-inner">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 bg-[length:200%_auto]"
                      animate={{ backgroundPosition: ["0% center", "100% center"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      initial={{ width: 0 }}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-4 animate-pulse text-center text-xs font-medium text-pink-600">
                    {progress < 40 ? "画像を読み込み中..." : progress < 80 ? "要素を抽出中..." : "レポートを作成中..."}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area */}
        <div ref={resultRef} className="scroll-mt-8">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10"
            >
              {/* Score & Overview */}
              <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-5">
                  <div className="group relative aspect-[4/5] overflow-hidden rounded-[32px] bg-white shadow-xl shadow-neutral-200 ring-1 ring-neutral-100">
                    <div 
                      className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                      onScroll={handleScroll}
                    >
                      {result.media_urls ? (
                        result.media_urls.map((m: string, i: number) => (
                          <div key={i} className="min-w-full snap-center">
                            <img src={m} alt="" className="h-full w-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <img src={result.media_url || previewUrl || undefined} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>

                    {/* Image Index Indicator */}
                    {result.media_urls && result.media_urls.length > 1 && (
                      <div className="absolute right-6 top-6 rounded-full bg-black/50 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        {currentImageIndex + 1} / {result.media_urls.length}
                      </div>
                    )}

                    {/* Floating Score Badge */}
                    <div className="absolute bottom-6 right-6 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white/90 p-2 shadow-lg backdrop-blur-xl ring-1 ring-white">
                      <span className="text-xl font-black text-pink-600">{result.score}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Score</span>
                    </div>

                    {/* Simple Dot Indicators (Desktop) */}
                    {result.media_urls && result.media_urls.length > 1 && (
                      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5 p-2 bg-black/20 rounded-full backdrop-blur-sm">
                        {result.media_urls.map((_: any, i: number) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 w-1 rounded-full transition-all",
                              currentImageIndex === i ? "w-3 bg-white" : "bg-white/40"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-center md:col-span-7">
                  <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600 text-white shadow-lg shadow-pink-200">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <h2 className="mb-5 text-3xl font-black leading-tight">
                    今回の投稿の<br />
                    <span className="text-pink-600">AIフィードバック</span>
                  </h2>
                  <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
                    <p className="text-lg font-medium leading-relaxed text-neutral-700">
                      「{result.summary}」
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback Categorized */}
              <div className="grid gap-5 md:grid-cols-3">
                {['good', 'bad', 'suggestion'].map((cat) => {
                  const items = result.feedbacks?.filter((f: any) => f.category === cat) || [];
                  if (items.length === 0 && cat !== 'suggestion') return null;

                  const config = {
                    good: { label: 'Good Points', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, border: 'border-emerald-100' },
                    bad: { label: 'Bad Points', color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle, border: 'border-rose-100' },
                    suggestion: { label: 'Advice', color: 'text-blue-600', bg: 'bg-blue-50', icon: Lightbulb, border: 'border-blue-100' },
                  }[cat as 'good' | 'bad' | 'suggestion'];

                  return (
                    <div key={cat} className={cn("rounded-[24px] border p-6 shadow-sm", config.bg, config.border)}>
                      <div className="mb-5 flex items-center gap-2.5">
                        <config.icon className={cn("h-5 w-5", config.color)} />
                        <h3 className={cn("text-base font-black uppercase tracking-wider", config.color)}>
                          {config.label}
                        </h3>
                      </div>
                      <div className="space-y-5">
                        {items.length > 0 ? items.map((f: any, i: number) => (
                          <div key={i} className="group">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              {f.location && (
                                <span className={cn(
                                  "rounded-md px-1.5 py-0.5 text-[9px] font-bold shadow-sm ring-1",
                                  f.location.includes("キャプション") || f.location.includes("ハッシュタグ") 
                                    ? "bg-pink-50 text-pink-600 ring-pink-100" 
                                    : "bg-white text-neutral-400 ring-neutral-100"
                                )}>
                                  {f.location}
                                </span>
                              )}
                              <h4 className="text-sm font-bold text-neutral-900 group-hover:text-pink-600 transition-colors">
                                {f.point}
                              </h4>
                            </div>
                            <p className="text-xs leading-relaxed text-neutral-600">
                              {f.suggestion}
                            </p>
                          </div>
                        )) : (
                          <p className="text-xs text-neutral-400 italic">No items identified.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Plan */}
              <div className="overflow-hidden rounded-[32px] bg-neutral-900 p-10 text-white shadow-xl">
                <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
                  <div>
                    <h3 className="text-2xl font-black">Next Steps</h3>
                    <p className="mt-1.5 text-neutral-400 text-base">明日からすぐに実行できる改善案</p>
                  </div>
                  <div className="hidden h-px flex-1 bg-neutral-800 md:block mx-8" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-600 text-white shadow-xl shadow-pink-900/20">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-3">
                  {result.action_plan?.map((plan: any, i: number) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -4 }}
                      className="relative rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                    >
                      <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-xl bg-pink-600 text-base font-black">
                        {i + 1}
                      </div>
                      <p className="text-base font-medium leading-relaxed">
                        {typeof plan === 'string' ? plan : (plan.title || plan.point || JSON.stringify(plan))}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => {
                    setResult(null);
                    setPreviewUrl(null);
                    setSelectedPost(null);
                    setUrl("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-full bg-white px-6 py-3 text-sm font-bold shadow-sm ring-1 ring-neutral-200 transition-all hover:bg-neutral-50"
                >
                  別の投稿を分析する
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
