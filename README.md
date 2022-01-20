# クリックした道が重要か色で伝える

![name](https://img.shields.io/badge/時空間情報処理特論-blue.svg)

## 背景

-   大学院の講義「時空間情報処理特論」の最終課題
    -   講義で扱ったアルゴリズム（R-Tree, DBSCAN, Dijkstra）を用いて，可視化まで含んだ地理情報アプリケーションを作る
-   「管理者不明橋（勝手橋とも）」の存在をニュース[^1]で知った
    -   設置者がわからず，誰が管理するか決まっていない橋
    -   住民にとっては，安全が保証されていなくても，近道のために無くてはならない橋なのだそう

[^1]: https://www.yomiuri.co.jp/national/20211122-OYT1T50059/

## 道路の重要度

ここでは，道路中心線[^2]の重要度を可視化してみたい．

ある道路が突然消えた時に，特定の場所までの最短距離がどれだけ長くなったかに応じて，色（緑，黄，赤，黒）を変えることにした．

---

道路 <img src=
"https://render.githubusercontent.com/render/math?math=%5Cdisplaystyle+e"
alt="e"> が地点 <img src=
"https://render.githubusercontent.com/render/math?math=%5Cdisplaystyle+s"
alt="s"> に与える影響を次式で定義する．

<img src=importance.png>

<!-- $$\max_{\{ランダムに選んだゴール g\}} (e がないときの s\mathrm{-}g 間の最短距離) - (e があるときの s\mathrm{-}g 間の最短距離)$$ -->

---

[^2]: https://github.com/gsi-cyberjapan/experimental_rdcl
