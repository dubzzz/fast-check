---
slug: /core-blocks/arbitraries/fake-data/fuzzed/
---

# Fuzzed

Generate fuzzed values.

## fuzzedString

TODO

**Signatures:**

- `fc.fuzzedString(corpus)`

**with:**

- `corpus` — _TODO_

**Usages:**

```js
fc.fuzzedString([
  '<a href="https://fast-check.dev/" target="_blank">Link to official documentation</a>',
  '<h1>Here is a Title</h1>',
  '<h2>Here is a Sub-Title</h2>',
  '<p>A paragraph having some text in <b>bold</b> and some in <i>Italic</i></p>',
]);
// Examples of generated values:
// • "<htld<p>He a> Sume</agre tome<ia>Heraph2>Hexttarextlev/pas d</p>"
// • "<b-chre alit an h1>Itlank omerg a son Sub>"
// • "</h2>A a sometl Sume<h1>It=\"></a hentle<h1>"
// • "</ick.de<h1>"
// • "<pstist=\"_blin a s:/farale stevink a Titp>It-cub>Lick hrefistlara>"
// • "</b>He i>"
// • "<a stind itag Tioff=\"_bo te tolevit Subl s of=\"_bon</ap>Itl a a inderev/hre <he iare</i>"
// • "</\" iofali>Ita t=\">Li>A h1>Liaph2>"
// • "<h2>"
// • "</haget-Tin iolalentin tal tleffin itank Subld a>Hev/ha handof=\" Tin </ink\">"
// • "<//fiarge itl ange</fap>A is ag i>A <h2>Lia talio itl Sumerank\" defa <a teviand<h1>"
// • "<av/bl olangetavink.dome Sublec</in Tic<b-Titl s t=\">"
// • "</i>"
// • "<hrengextarg iargrech2>"
// • "</are ometaldo ic<in itldechte t patend</itastof=\"_b><boletpa>He</phrerap>Ittpa tle <bome h1>Hef=\"hetoffa i>A t=\"h1>b>"
// • "<phralan ock\"_bl ht olale tocumere i>He te o p>Hef=\"httphe ph some olal iocin Suboc</is itph2>"
// • "<////halite s </f=\"_blichevit-ciome offf=\">"
// • "</in iolapa Ti>Itisong phtofa>A he</bont-Tingrat-cume <iaget-c<he h1>Lind aps d he<av/intto <//pargravink\">Lin</htle istt i>"
// • "</bome d </hto a s inden h ta>Heran h2>"
// • "</ita>b>"
// • "<hec</hta itonk\"_bl alexta sta <b>"
// • "<aran ttlaph2>"
// • "</b>A hap> an<asomef=\"_b>"
// • "<av/h1><h io sonde</b>Hergevin tomere Ticub>"
// • "</\" Tich2>"
// • "</ffatt=\" <ink\">He<hton<hank.d</fffas is:/an iap>Ittpa>"
// • "</he<p>Itoff=\"htlank.d ald</ararate te avin</p>Itetarevin Sumenk.de<blal h2>"
// • "</ick <ionk.dof=\" h2>He sof=\"hrge<iso tand<h2>Liare</b>"
// • "</agrefink.dolag <h1>"
// • "<p></ph icistp></b-ck\"_b-cub-ck alecumextank htank\"hto tpstldext=\">"
// • "</hap> ia h1>Li>A Sume offf=\">"
// • "<ioff=\"h2>Link.d p>"
// • "</hre<bl in p>Itld<p>Li> tatle i>He</h2>Heta hras is:/b> ichagefan h2>bo a in ia offa int=\"hrarev/ha p>He<he<h1> a s:/h1>b-cublal p>b-cumefiolal Tiso domerenk\">"
// • "<hav//\" s:/\">Hev/b>He pson<he p>Li>Hen a ick h2>"
// • "</he stt-cick ttan h in is tastef=\">"
// • "<ph1>Lind Sumergre</ink tpsta ticumeck.d<he s s ic</\" <hatl Sublit-Ticha>A hergetand a Tin atlexttasome<a h1>bleck\" tt=\" <p>"
// • "<hrg in ofa h1>b> tlink.d st=\"_b-Tichrecha>Lichtl inde<bomeffic<a>It tefin</ffalenk.dola t tinde <p>"
// • "<b>"
// • "</bomec</are hav/b>"
// • "<in Tintintp>"
// • "</h1></h1>Ittastagev//i>Itofa </hrank.de<hav/\">b-ch st=\"h1>"
// • "<apso i>blind<arevinge d in</hrenta><//in t-ch2>"
// • "</het-Tin s i>"
// • "<iol tapsong alerergen aps:/\">"
// • "<ph on ti>It atterenk.d<a intps:/h1>"
// • "<bl Sumen Subocia>Heret-ch in</h1> ink.d d<hrattarasonde</b-Tis:/a tldock.de t-Tink.d Tintarge atlen io so hang Ti>A ang hanta araretaralastld a aso tlitap>"
// • "</bol t=\"h1>Hen<a>A tarech1>"
// • "<ag </f=\">b> tlav/hra s stp>"
// • "</\"> de agrap>"
// • "<al ock some ick\"h1>"
// • …

fc.fuzzedString([
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
// • "885646846"
// • "8560"
// • "508333"
// • "56916"
// • "803 Apte Overmiton Suiterterg 428"
// • "6 Buites Suit. Suit. Suilelch Wias 42"
// • "6868806557"
// • "1 Rassss Wit. 90"
// • "585690645850812808 Maride 498"
// • "6 Plite Surve 68 Cid Cach 913 Apitercida Rorvern Man Suicl Alst. Suid Suit. 121 Knderks Suites Suit. Suitelbe Rollbe Ovobuit. 90"
// • "50"
// • "8 421313133331"
// • "649 906 Paptelllberpt 12127"
// • "846"
// • "428 Surn Herzog 46064 Caderte Mapiterilbuilbern We 1"
// • "5881 11"
// • "83 Heriarmiterkss 1 Hilynonobe Robuite Suilelernoberilissterks Kn 428033"
// • "857"
// • "83 Papts Suit. 9064656"
// • "56 Pale Suicit. Frmite Rormite Hidallar Hidapt. 13 Hillariciss 1"
// • "48642898 He Mas Kn 427"
// • "6 Mas He Apterpas Pler Suida 13 Suite 49 Suidande Cadalel Cias Ape Suitesit Suite Roburmis Knog Surcitoburvernobuich Cidacert. Alcitss Wervel Frmidan Aptertes Mas 1"
// • "65503 Capirtert Suills Suide Calsices Ple 1"
// • "603 Van 1213 9164 Sur Wite Plciter Cit. Kn 428 Suillbuites 1213 Suiss Suil Mad Carcidacerterve Ple 8 131 12"
// • "8 1 Vape 4 Hinon Wite Knor He 90650"
// • "1213 Marin Suitert Suiale Hermida 4216"
// • "8 Pllallsirpte He Suit Roburzon Suite Suit. 4560656"
// • "5846"
// • "569 98556856555648"
// • "133"
// • "564984 Surks Apan Hinder Suin 4211"
// • "4 Builberzog Surn He Suis Pa Suillyn 4846421 Suiss 903"
// • "6456"
// • "127"
// • "645068 He Vas 69 464986"
// • "56851650645642"
// • "512"
// • "8428891 48 Suile 1 603 8 Suite 1 Surt. 6808 Suidasite Als Wirg Knoberzon 427"
// • "806"
// • "89 Ple Frpessit Witervonorn Valite Suid Knobe Alerksitola Vape Surt. Alerits Apace 1"
// • "65648564211 46 Apall 64 1 Pleridapace Surg Frzon Ma 131127"
// • "5698"
// • "1"
// • "51"
// • "860606 Suiss Suite 48 Buiterzolit 498421"
// • "8 Cias Suilcirt. 427"
// • "88503"
// • "511"
// • "8"
// • "856558"
// • …

fc.fuzzedString([
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
// • "Glstaledr"
// • "Celelishanntric Tamitz"
// • "Cedyn"
// • "Passtaladystrichulieri D"
// • "Glaule Lichula Sc Hichnnienchnt"
// • "Mi Schulantr"
// • "Pasler"
// • "Glelsadris Kul"
// • "Ce Sch"
// • "Pa Li Misa Li MD"
// • "Glalaulaugl"
// • "Lellantr"
// • "Licha Kuppppphuadr"
// • "Her"
// • "Gls Ta St"
// • "MDouglasantz"
// • "Lelalitanishntr"
// • "Cenn Sch"
// • "Pa Kuleslenier"
// • "Joulenntoula Ker"
// • "Mitonick Kerich"
// • "Cela Wa Kupphulanis"
// • "Jonitz"
// • "Padr"
// • "Gla Doupe Sta Wadr"
// • "Hick Schugl"
// • "Leris"
// • "Lis Wadyn"
// • "Pa Wa Kule Liedris"
// • "Pa Sc Keri Kuls Muglanntz"
// • "Pa Schnis St"
// • "Pauanichuphuadysaupppe D"
// • "Johuphnni Hedrish"
// • "Gls Schnitanch"
// • "Panich"
// • "Gla Watris"
// • "Hichn Kuppelslasadys Douatoul"
// • "Cedystouppph"
// • "Cenchntadysstonichatanchnish"
// • "Gl"
// • "Lynnnta Schulerichupphn D"
// • "Padysa Ler"
// • "Glele Hesan"
// • "Le Kugler"
// • "Jonta Kell"
// • "Pamielalitr"
// • "Mulelier"
// • "Juler"
// • "Lelsllllauphulla Wa Tas Schulells Hic Tannni Kula Ker"
// • "Panic Donintallash"
// • …

fc.fuzzedString([
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
// • "coscotyain.co.kil.com"
// • "tmairil.corittma.cote_ho.pa.com"
// • "l.comail.cotel.cirel.coskorisilvamisai@homaia_k_m"
// • "ailvaschorl.cotel.comoste_mail.co.cotm"
// • "parli@homain_jail.pai@hain@gmaitman.co.cooomawn80@gm"
// • "l.co.co.co.kil.comahosa.co.co.coskolingmomol.cki@hahomahan80@gm"
// • "tyakil.cotm"
// • "bindostyaren_hattmo_ho.patmaibil6@hotm"
// • "comain80@y_lilvai@gm"
// • "paiskitmo.co.cote41@gmaitm"
// • "ttma_momistyawndo.comicom"
// • "eliscin@gmastrill.comarin80@gmaitet@gm"
// • "pali@hom"
// • "biscorill.coma_hail.coooomiare417@gmil.coscoom"
// • "com"
// • "terisilliliskil.cosco.cotmare_kiarlaill.chotmail.kilolllvatyakibbil.cotettm"
// • "ciskibil.co.co.comailailieskiren.co.colill.chawn80@g17@hol.comai@gmahomotescomai@homailvakicho.cotyaiscil6@gm"
// • "be417@gmicom"
// • "l.coskitre41@g17@gmakil6@y_hail.comahom"
// • "chotmailom"
// • "libil.ci@hotmail.ckotestesken80@yshya.palil.king17@hom"
// • "berail666@gmatm"
// • "paicom"
// • "esan80@g17@gm"
// • "l.comatete417@gm"
// • "comail.cotyahoskil3@gm"
// • "cottell.comarailial.com"
// • "etrin@g1@gm"
// • "l.coty_hom"
// • "etrelil.cot@homarl.comaico_kiristtm"
// • "pam"
// • "pando.kil.comishysco.coo.coom"
// • "biall.chahomaretribesahom"
// • "chott@gma_lo.pailskil66@gmosil.co.kittettmakeriee417@g17@yskisttelil.coom"
// • "ttrel.chascoom"
// • "testel.comail.k_hom"
// • "ain@gmam"
// • "brat@hooomawndom"
// • "t@g1@holsaril.coolva_hom"
// • "ty_miske417@homan@yandoom"
// • "bell.com"
// • "ai@gmaill.comi@yari@yakil.pail.co.kiliril66@yaityaril.cindom"
// • "bit@gmil.cil.co.kirel.comangmawn_mai@gm"
// • "l.coomitttttm"
// • "akiscomakil.coom"
// • "teshomail.comal.comahomain80@y_komaibe_hain@gmat@gmatm"
// • "brl.com"
// • "tysin@hatyal.co.com"
// • "paindomaico_jam"
// • "tritel.comamahotm"
// • …

fc.fuzzedString([
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
// • "htene"
// • "htereame-ps:/whtt.n-ps-fare-borgal.biz/cr.n.o"
// • "httin-g/"
// • "htivory.ify.iz"
// • "htpsefenttps:/jeleameluet"
// • "htpenaliostactioredeatttpo"
// • "htamenbory.blt.on.n.ne-dules-dd-pavacorgnavo"
// • "htttt/denantps:/tiefan-sel.onttpin-pssperenttpeps:/jelul.bitps-ps://"
// • "htpsconivorn-ss:/iouedinen-ps:/bltpele/criorgadetttedeame.nbitergnfucry.nbinfucrnbl.ne-deded-bor.nied-de"
// • "ht.niz"
// • "hign.n-d-ps:/merg/"
// • "httpalis:/bluletes-de-sps://je"
// • "htetpelue/jelalin-fede/feluenade-facor.natpsps:/"
// • "h.ierescreduer.n-g/"
// • "httpss:/mesinfuelifepstt"
// • "htenaneattpiornfy.oname.io"
// • "htteps:////////fucien.niz/tiz/"
// • "htttamerg//inalaned-s://tps://///whtps:/whttpspaco"
// • "ht"
// • "htiz"
// • "htpe-pssctpelluct"
// • "h.nbociz/fuscrnblieluenamele.bolin-pe-difer.igans:/coueduen.nfy.n.bionbitpscttin.iforg/ttte-ps:/jerg/tpe"
// • "httpspsis://mepetps-bisetpery.in.ips:///ctiornelen-stps-ps:/"
// • "htttps:/"
// • "htpettttps://"
// • "httergal.neametpettele-fede/"
// • "htpsinerintpscorgaluettps:/"
// • "httisis:/"
// • "h.n-s:/"
// • "htps:///defe-gacinetpiz/cornbio"
// • "htpivo"
// • "h.biz"
// • "https:/mename.n.inefoneame"
// • "hte-blos:/je-defuededued-bone-ponanin.bont/"
// • "htiz/cus:/tps://"
// • "htterg//whtpselelditpetpe-fo"
// • "httteamergne.bor.bornanentpame-sper.bldderan-de-gns:///jery.io"
// • "httttt/jefy.info"
// • "htps:/ifosttpamettps:///bos:/ioradd-d-g///cre/whtps:/"
// • "htpsis:/"
// • "h.binfettealalull.biz//binin.nbocrg//cig//whtittps://"
// • "htter.nfoseponeamealalorealiz/d-denined-pe.nbler.blddenfachttttps:/metpens://"
// • "httt.olucucis:///is://inefenifonens:/whtpor.neamenspe-pereris:/biorgan.orametpon.octtps:/mealos:/je-fan.nettadigns:/"
// • "htavo"
// • "h.nfacrnios://je///"
// • "htps://"
// • "htt"
// • "htpsens:/tpealttps:/duetpscielamern-stps-dergalan-g/jeriol.ner.narnacory.ore"
// • "htpsis://ttivo"
// • "httpse-sionere.nadus:/"
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/fuzzedString.html).  
Available since x.x.x.
