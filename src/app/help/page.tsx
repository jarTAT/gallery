export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Telegram 入门教程</h1>
      <p className="text-gray-500 mb-8 italic">此教程仅作为新手使用 Telegram 的教学，还有很多其他知识需要自己慢慢摸索。</p>

      <div className="space-y-8">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">简单介绍</h2>
          <p className="text-gray-600 leading-relaxed">
            Telegram（又称 TG、电报或纸飞机）是一款专注于速度与安全的跨平台即时通讯软件。因为不会收到审核管制所以常作为传播各种文件、视频、图片和自由聊天的工具，其核心功能——频道，对于文件分享功能更是如虎添翼。
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">官网 &amp; 下载地址</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span><b>官网地址</b>（提供各个平台版本下载）：<a href="https://telegram.org/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 break-all">https://telegram.org/</a></span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span><b>网页版地址</b>：<a href="https://web.telegram.org/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 break-all">https://web.telegram.org/</a></span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span><b>谷歌商店版</b>（安卓）：<a href="https://play.google.com/store/apps/details?id=org.thunderdog.challegram&hl=en" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 break-all">Play Store 下载</a></span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span><b>官网安卓端</b>：<a href="https://telegram.org/android" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 break-all">https://telegram.org/android</a></span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span><b>官网 iOS 端</b>：<a href="https://telegram.org/dl/ios" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 break-all">https://telegram.org/dl/ios</a></span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span><b>官网 Win/Linux</b>：<a href="https://desktop.telegram.org/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 break-all">https://desktop.telegram.org/</a></span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span><b>官网 Mac 端</b>：<a href="https://macos.telegram.org/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 break-all">https://macos.telegram.org/</a></span>
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">账号注册</h2>
          <p className="text-gray-600 leading-relaxed">
            根据提示输入区号（中国大陆为 +86）和手机号接收验证码即可完成注册。
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">汉化方法</h2>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>
                <b>方法一</b>：在已有联系人或群组的情况下，发送这个链接
                <a href="tg://setlanguage?lang=zhcncc" className="text-primary-600 hover:text-primary-700 break-all"> tg://setlanguage?lang=zhcncc</a> 再点击汉化即可
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>
                <b>方法二</b>：在软件内搜索框搜索 setlanguagelangzhcncc，或浏览器打开
                <a href="https://t.me/setlanguagelangzhcncc" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 break-all"> https://t.me/setlanguagelangzhcncc</a>
                ，进入汉化频道，无需关注，点击其介绍页链接即可完成汉化
              </span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">加入群组 &amp; 订阅频道</h2>
          <ol className="space-y-3 text-gray-600 list-decimal list-inside">
            <li>通过软件内搜索框搜索频道代码（也就是频道链接后面那串字符）</li>
            <li>使用搜索框查找频道名（不推荐，不一定能精确找到）</li>
            <li>用浏览器打开频道链接，会自动跳转到软件里并进入频道</li>
          </ol>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">使用建议【很重要！】</h2>
          <ol className="space-y-3 text-gray-600 list-decimal">
            <li>此软件（包括网站）全程需要在<strong>科学上网</strong>环境下进行</li>
            <li>注册账号时会要求你填写姓名（其实是让我修改网名），千万不要使用<strong>真实姓名</strong>！</li>
            <li>某些频道可能会加入广告，请辨别真伪，建议<strong>不要乱点不明链接</strong></li>
            <li>必须<strong>隐藏好自己的电话号码</strong>！位置在 设置 &gt; 隐私，保护个人隐私</li>
            <li>开始使用前去 设置 &gt; 隐私 里把<strong>自动注销时间修改为最大值</strong>（一年），如果不想被删号，登录间隔千万不要超过一年</li>
            <li><strong>发言要谨慎</strong>（在外网行为更需谨慎）！难免会遇到图谋不轨的人，一旦你的言论或行为被人盯上，轻则骚扰电话、广告信息，重则可能被开盒；如涉及严重违法行为、组织犯罪，很大概率会被调查</li>
            <li>电报<strong>能使用代理</strong>（代理后可以不使用科学上网工具），有公益频道会定期分享免费代理，点击其链接可自动完成配置，但免费代理一般只能坚持一周至一月不等</li>
          </ol>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">免责声明</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            所有内容均来源于公开网络教程整理，仅供参考学习使用。请遵守当地法律法规，合理、合规地使用相关工具与服务。本页所展示的第三方链接与本站无关。
          </p>
        </section>
      </div>
    </div>
  );
}