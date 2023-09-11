---
slug: /core-blocks/arbitraries/fake-data/fuzzed/
---

# Fuzzed

Generate fuzzed values.

## fuzzedString10

TODO

**Signatures:**

- `fc.fuzzedString10(corpus)`

**with:**

- `corpus` — _TODO_

**Usages:**

```js
fc.fuzzedString10([
  '<a href="https://fast-check.dev/" target="_blank">Link to official documentation</a>',
  '<h1>Here is a Title</h1>',
  '<h2>Here is a Sub-Title</h2>',
  '<p>A paragraph having some text in <b>bold</b> and some in <i>Italic</i></p>',
]);
// Examples of generated values:
// • "<he te ich1>"
// • "</in old<h1>Hef=\"han<pstal ittextp><h1>Heretta tpali>A st-cha to off=\"_b-Ticumeta p>"
// • "<p>A pant d</and some tld<p>A <h1>Here ingexti> ink t=\" sof=\"h1>"
// • "<h1>He p>"
// • "<h1>Here in i>Itps <an ast-chetlal a some</blagev/\" tenk\" h2>"
// • "<h2>Heretal doc<h1>Herg ink\"h2> ing alev//\" iank\">A Sume in <//fa>"
// • "<h2>Here is ingengrge</b>"
// • "</iav/h2>"
// • "<h2>A Tite<psomere ton<h2>Heraraleragravink p><arecub> avi><h2>Hetle</h a h2></h Sub-Title<h2>Here tlial p>Lin ha>"
// • "<a href=\"hre i>b-Titarge<p>A <h1>Here is he<h1>A tocumen in ta>"
// • "<a href=\">"
// • "<i>Itof=\">"
// • "<a hre tas is:/pat-chaviofficisoffffal al ph2>"
// • "<a href=\"h sonk s:/farge in tatle<p>He i>Hetatp>"
// • "<a hrecume ink Tiaraph1>Here Sublap><p>A h1>"
// • "<h2>Hende ic<h2>Herere s d<h1>"
// • "<a href=\"h2>Lin <htecume<itin oc<h2>Here is a Tin Tic<p>A pap>"
// • "<h1>Hen talic</ink\"_bonk hagrereffindevin <h2>Herg it-c<are tev/hech1>blit ataref=\"_blantph <h1>Hetaletat ps://fa>"
// • "<a hrev/iofargraling h1>Het=\"httlin some Title<h2>Here text alite<h1><b>He<h1>Henk tlev/\" avintaralasome h2> Titale<a hrefaldext in i>"
// • "<p>A paragra alare ink\">Li>Itenk tin some son a ia ic</in pal istav/\"hetle<h1>"
// • "<h1>Lin <a> some ista ici>"
// • "<p>A alechtt <a sondev/\" domev/\" d<ale<h1>Hext i>"
// • "<b>Itlenk\">Link Sub-Ti>"
// • "<h1>He it-cume i>He iomevitald<h1>b-ck.d p>"
// • "<h1>Here iondoffficume tochere</ank texta ont-ciola h1><and araps:/f=\"_blap>Lin to s in sonk.dev/\" tps:/fare i></h2>Lin <b>"
// • "<a hre<a href=\"htt=\"_bla Sub-Titiaviterecial tale in tagrevink\" h1>bli>"
// • "<h2>He<h2><ha itlapa>"
// • "</h1>Herefi>Ite on<h1>Hereragreck tome<a s p>Lich <a h2>Here atlef=\"h2>Iterent Sub>A <a href=\"hrendon<hre<p>A in ta>He<//\"_bold<as:/b>Itaph2>Heviank\">"
// • "<h2>"
// • "<h2>Henk al dont=\">It ha al a tlde Tin ock.de<p>Here is Title<h s <a>It-Tialeciantolend<h2>Hetlagref=\">"
// • "<h1>Here ing to officia>"
// • "<a hre Sublend d<h te iole i> italatis <h1>"
// • "<a hrev/icittle tlenk\"he h1>Itle</\" isomentat s://hetav//fal tlere Subock\"h2>"
// • "</icubole<ps://fas:/bol it-Tit ing s ph2><p>"
// • "<a href=\"hta s alen a tat=\"_b><h1>"
// • "<htarefan in <iomevis ap><a s <hrev/ht-che atle<b>Here so <h1>b-Tis ic</ichext talingra p> tp>b>"
// • "<a href=\"htps:/ficic<hec<aragra>"
// • "<b>Lit is on<h isome tlink.dev/h1>He<p>Licick a>A ic<h2>Heff=\">Listome in ha a i>Li>"
// • "<h1>He taralast isol some <h1>Here ich1>He ink.de ta>"
// • "<a it ink\">Link is tpas i><anta>"
// • "<h1>Here<h2>Here itapast ara aphareck.domera>Here <h1>Here tef=\"he arav/\" to in arext ing pald<harg a><h2>He<htioldent-Ti>Heta ison<h1>Heran ind<aragrap><a iomerefargenk\"_boldofav/\" tldefin </a>"
// • "<a he is phre t is is in<ha <h1>"
// • "<h2>Here in <h1>Hengrg h1>"
// • "<p>A is astlend<hef=\"h2>bold and h2>"
// • "<h2>Herefalerargrarge iolavistlav/h1><p>A ph tle a>"
// • "<h1>Here it ong atavin <in toffis texttiondon<h2>"
// • "<h2>Heralite itle is told hrge s <hretank\">"
// • "<h1>Here is offi>A iap>Hev/ffastonta d on<itaras:/p>"
// • "<a hreffin<h1>b> is targe ome tl a a Subome is aldec<p>A <icis pa <h2>"
// • "<h1>Here</b-Titpant=\"hre tenk\" in d<ha hefala>"
// • …

fc.fuzzedString10([
  '6506 Frida Rapid Suite 656',
  '491 Alicia Circles Suite 128',
  '5683 Welch Cape Suite 486',
  '55608 Wilburn Burg Apt. 121',
  '8421 Cassin Place Apt. 903',
  '858 Madalyn Knolls Apt. 812',
  '51691 Roberts Overpass Suite 131',
  '1133 Herzog Manor Suite 457',
  '889 Hermiston Parks Suite 980',
  '6464 Vandervort Hill Suite 427',
]);
// Examples of generated values:
// • "651133 491 851284212"
// • "51691 Overvolit. 12"
// • "1133 889 Ra 911"
// • "8421 Casinollclbur Wesirve Hite We Mada 9 Cid 80"
// • "65111313333 Hiterve Rorkst. 903"
// • "5164646"
// • "57"
// • "889 Hervog Suite Suit. Passs Burperte 1 Pace Suite Madass Burtoberite Pl Ca Surpt. Overpadallite 4856889 Hermite Frite Aper Frpes Apt. Man Frpt. 8513 48491 1111"
// • "56848491 He 8556088856888 Marg 121"
// • "516913 Frilbuite 427"
// • "5560"
// • "16491 691 Werpitondan 12888421113 Wite 131133 Suiartermin Burmite 9 98456883 Apt. Capermit. 6556"
// • "516551284911 Hervor Werg Suite Suiapte 128889 Suit. Herg 490650645112"
// • "491 Capt. Suite 427"
// • "1111133 Welbercl Suirials Suite Welil Vassillyn Apt. Cass Vapts Suitess Apt. Papiterg Frnollite Rond Rad Ra 64911"
// • "5650656506491 Cas Apts 491 Wite 133 We 1113333 Wicerndasss 90"
// • "56"
// • "8421 98506491 Aptss Suiterks Suit. Suite Suite 1 Manoburvobele 427"
// • "51691128421 Wernollasst. Suiterzog 65685685685649 4 Hilaperzobuiciacit. 491 Aliciapas Malbur Overg 113 Wermid Ove Apercl Suit. Ove 91 Suiss Herte Plls Papiapt. Aptsstes 98"
// • "6506 Frianort Surg Vace 98491 Frn 491133 Herzog Suin Ralbuida Capite 980"
// • "6"
// • "4868491 Apallch Wits Overmis Suiterg He 12131133 113111 Ran 491 Suite 427"
// • "651 Madalynde 91 Can Ma 8465064564911133 Herzondermit. Suit. Hern 1113 Mapida Apt. Suite 127"
// • "865111121331"
// • "8421 Hes Kn 1 Knoberg Herperve 113"
// • "491 Plape Suirite 11133 Herzoris Suite 4911"
// • "1 Frirpton Pla 491316555111112"
// • "5683 Ra Knol Raperzog Man Ala 1 He Suite 1691111 Wite Kndasst 48889 Hermis Cite 912"
// • "8885833127"
// • "427"
// • "1133 Herte Pllllbern 9 Cil Hite Hirptog Mastonor He 116465064 Buisin Carmias Suitess Surterzorce Suite 4855608 Pach He 457"
// • "51691 Rorid Ape Wit. 88858 Apte He Suite He Suitond Suite 6456491 111 Ca Rorzor Ca Mall Apt. Hite Mass Suite Suis Mass Fr 650"
// • "89 Capid 48491 Wia Cas We Va 491 Alite 1311 Suites Parksidan Ple Suite Rapt. 89 Hermida Hercite Albuidale Mapida 9133"
// • "1133 491133 Suite 649 Mas 121"
// • "51 Hess Hias 9064 Buiade 127"
// • "1133 Cill Fr Surg Ovorte Suite 858491 Apt. Wer Suite 427"
// • "556885556556885127"
// • "8421 Cas Pas 1"
// • "491 9113 Werg 491 Alirzorias 851131212842121 Apte 133 Apistog Manor Suit. Va Caperg Suit. Suila Apas Apt Apiclbe Apt. 90"
// • "55608 Wilyn Suian Hilch Cacill Ma Wite 1"
// • "6506 Frte Suitermiss 642"
// • "5683 We Apt 9851"
// • "60889 Plas Alanon Hes Man Vas Heste 980"
// • "81113113 Manolal Frid Plert. 4912"
// • "85851 Suite 486"
// • "6421"
// • "85842121 488511"
// • "85849113 Hiterte Alit. Al He 491656491 Pan 8 Cace Panorzorvoberks 11 Van 49 Suid Ove 113 Vaparks Apilern 49113 Plssis Suite Knollstor Aptelapte Apt Rormite Ma 88 Wirclyn Plllid 11 Hida Burnorte Hills 912133 427"
// • "5683 Welelil Raderks Caciande Herton 111 168516564646491331 Burpa Wite 46491 Robermiladarts Apt. 851"
// • "656"
// • …

fc.fuzzedString10([
  'Cedric Muller',
  'Gladys Lynch',
  'Juanita Hintz',
  'Miss Tami Walsh',
  'Lisa Kessler',
  'Johnnie Schulist',
  'Helen Schuppe MD',
  'Patrick Stanton',
  'Paula Kuphal',
  'Lela Douglas',
]);
// Examples of generated values:
// • "Miss Tami Kuatr"
// • "Lela Dougla Lelanit"
// • "Miss Schuppelentanchnntadys Ler"
// • "Paula Kuphantouls Tata Stan"
// • "Paula Kuphalatami Leler"
// • "Cedric Mistat"
// • "Miss Talla Kulauppesler"
// • "Hedrichupe Schupe MD"
// • "MD"
// • "Gladyst"
// • "Miss Tamich"
// • "Hintz"
// • "Gladyslie Schuppe Tauanita List"
// • "Cedrit"
// • "Johnnie Schuppe MDougleli Wanital"
// • "Heledr"
// • "Helen D"
// • "Paula Hess"
// • "Cedric Mullic Mi Sch"
// • "Lelat"
// • "Juataniedysh"
// • "Cedric Mugladynnie Kuglasstoha Misllish"
// • "Helen Schuppe Miss Tami Walsh"
// • "Patrick Sc Sck Mick Sck Schupedynist"
// • "Patrick Helenn Schuppe Miss Tadrich"
// • "Lisas Minn Dohuphn Sch"
// • "Lela Kulisales Ke Sch"
// • "Patr"
// • "Helen Sch"
// • "Lisa Kessler"
// • "Patric He Watas"
// • "Patantohuphal"
// • "Gladys Lela Kupppe Sc Tastonis Wanie Wauppper"
// • "Juauglami Helench"
// • "Cedric Mislamichanitr"
// • "Lisa Ker"
// • "Miss Ta Doullamitrieler"
// • "Lela Doualss"
// • "Pamis"
// • "Lisa Kesslsanie MD"
// • "Muller"
// • "Helen Schuppessh"
// • "Cedric Mulelass Lick Walsl"
// • "Pa Wat"
// • "Lisa Kes"
// • "Patrick Kuphntz"
// • "Patrichuglshamis Miss Talenisshnchuph"
// • "Cedrick Schuls Ston"
// • "Cedys MD"
// • "Lisa Kessani Miss Wamis"
// • …

fc.fuzzedString10([
  'charity_keeling17@gmail.com',
  'tyshawn.parisian@gmail.com',
  'bette_hyatt@hotmail.com',
  'estell3@gmail.com',
  'alva.kirlin80@gmail.com',
  'patrick_jaskolski@hotmail.com',
  'loren_mosciski@yahoo.com',
  'teresa_hamill66@gmail.com',
  'libbie41@yahoo.com',
  'brando_lakin@hotmail.com',
]);
// Examples of generated values:
// • "tyshawn.choomail.com"
// • "brandom"
// • "l.com"
// • "teresa_hailskiliskomailibrahoskom"
// • "pate_hoo.kirili@hail.patyail.com"
// • "esttyskilil.co.com"
// • "com"
// • "estell3@gm"
// • "pat@yailorl.palicisttelom"
// • "patrick_jam"
// • "ll.com"
// • "bescom"
// • "bbril.com"
// • "ariski@gmaitte_keskestmal66@gm"
// • "brando_lom"
// • "brandosko.costeste_haisteresal.chal.com"
// • "brandoo.patestyshariteelva.kilo.chy_hom"
// • "aho.com"
// • "eresahom"
// • "bettyshalo.colibilorin80@y_lori@hyakil.com"
// • "tyshatetyshoshom"
// • "a.kirlischarisi@gmail.com"
// • "l3@homoteskil.chan.patystelibeteresa_hail.com"
// • "bestyaibren@gmaililicom"
// • "bestesa_m"
// • "patyalin_malorando_l.chakirestyaisi@homalom"
// • "terellotya.cote_hyskerin80@gm"
// • "charitm"
// • "alva.kilomal.com"
// • "patysin@hotestelomaicom"
// • "atrilski@hotm"
// • "bestelsityahal.chamalva.comoscotesty_kesalorestyateshali@hotesterin@gm"
// • "loren_hamalibrandoralvai@gm"
// • "en@gmak_hy_jailakilomailom"
// • "estelotesteresalom"
// • "elin@homalorlailibettyshomawn.cotyshawn80@gmaichahyalibrandom"
// • "patricke_hotelibeterel.co_ho.chom"
// • "testyskil.cho.com"
// • "bbil.com"
// • "chakingm"
// • "tyshalin80@gm"
// • "esterelo_l.com"
// • "charililirandom"
// • "brandomail.com"
// • "amailisil.chal.com"
// • "patrick_kil3@gmarl.com"
// • "estyshotmahaloren_m"
// • "terarl3@gmaiberelorestm"
// • "betteskoten_m"
// • "betterilin_m"
// • …

fc.fuzzedString10([
  'https://tan-parameter.name/',
  'https://inborn-signify.net',
  'https://jealous-deduction.biz/',
  'https://favorite-scientist.org/',
  'https://defenseless-peach.info',
  'https://cold-pipeline.org/',
  'https://blue-fuel.biz',
  'https://cultivated-bladder.name',
  'https://whispered-gallery.net/',
  'https://mediocre-deposition.info',
]);
// Examples of generated values:
// • "https://medine-ps:/delo"
// • "https://de"
// • "https://facrg/whttps://biory.bocren-pipernamenamentedediz/"
// • "https://blliepedealeletps://col.ify.name-s:/"
// • "https://in.nbiele.biz////ttps://falis-s://cul.orery.biz/"
// • "https:////whttps:///"
// • "https://iz"
// • "https://favornfamenss-ps://fadeter.bittttps://cultivame.iseforinfy.nbornerel.ous-dedite-deduseneten.bos:/blo"
// • "https://jelary.nfuery.ite"
// • "https://ttps://cosettps:/whttps://me-scio"
// • "https://ine.oldeltps://jentipetele-pion.biz/"
// • "https://bocr.ie-dig//cuctavorg/"
// • "httit"
// • "https://medist.bllueletps://depionied-pstpameltporg/"
// • "https://blue-del.is:/t"
// • "https://jealocultttps://defepss:/"
// • "https://whttps://jeameranarelttttps://cucue-d-fantigate-fatefy.ory.ntpspavorg/blus://dealttps://chttps://whttps://co"
// • "htamet"
// • "https:/whttps://ttps:/whtps://culenfo"
// • "https://mer.namefeame"
// • "https:///"
// • "https://whttps://tediel.nin-pign-sierer.isps:/"
// • "https://farn-pspie.blatps://bluelesps://delaco"
// • "https://dd-s-defess://"
// • "https:/biz"
// • "https://metps:/jery.nettps://tps://favo"
// • "https://cold-ps:///jerg/cultpornet"
// • "https://whttps://whttps://ctposivocre-d-g///core-bio"
// • "https://je-sig////"
// • "https://ttpactipspig/de-s:/d-ps:/corinboltpe-detps://consen.n-d-ped-schtenargnttttedultps://culelens://fo"
// • "https://mesttpsps:///whttps://talte//cipsis-ps://wht.o"
// • "https://///jelipe-ded-blepos://itin-ps:/couchtinblolon-fy.ips://jeal.bled-s://cole-desed-s:/"
// • "https://me-par.nenbous://"
// • "htpocos://cullorn.nfy.bips://whttps://"
// • "https://d-ps://bie-s-galinfone.nametps://melame"
// • "https:/felenio"
// • "https://cold-ps://chttps://bladere-de-psig/"
// • "https://cultttpselelielor.ifavoramed-s-s:/crg/"
// • "https://meame/blacitifousettiorg/"
// • "https://culattttps://"
// • "https://cratentpet"
// • "https://mettpselol.bit.n-s://ded-signedefo"
// • "https://fanaravate-ps-biz//jery.binerenetitis-ddepsinior.ochttpser.binetin.biz"
// • "https://blignify.netps:/"
// • "https://meriz/"
// • "https://wh.iz"
// • "https:///culte-gargameld-blion.bips://dus://whttpsepelucucon-ps:///cuctps:/mediz//////////tpenente.namettps://derede-scieane-sctps://whttps://cululdes://taletpsps:/"
// • "https://defe-dedentps:////"
// • "https://tantps:/"
// • "https://cocued-biss-dene-ps://defenat"
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/fuzzedString10.html).  
Available since x.x.x.
